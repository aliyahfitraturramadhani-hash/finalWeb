/**
 * Alokasikan eksemplar tersedia kepada antrean reservasi.
 *
 * WAJIB dipanggil di dalam transaksi database.
 *
 * Proses:
 * 1. Lock buku.
 * 2. Expire reservasi yang deadline-nya lewat.
 * 3. Lepaskan eksemplar yang sebelumnya ditahan.
 * 4. Ambil antrean menunggu paling awal.
 * 5. Ambil eksemplar tersedia.
 * 6. Alokasikan eksemplar.
 * 7. Perbarui status dan deadline.
 */
export async function allocateAvailableCopiesToReservations(
  client,
  bookId,
  processedBy = null
) {
  // =====================================================
  // 1. LOCK BOOK
  // =====================================================

  const bookLock = await client.query(
    `
      SELECT id
      FROM books
      WHERE id = $1
      FOR UPDATE
    `,
    [bookId]
  );

  if (!bookLock.rowCount) {
    throw new Error("Buku tidak ditemukan.");
  }

  // =====================================================
  // 2. EXPIRE RESERVATIONS
  // =====================================================

  const expiredReservations = await client.query(
    `
      SELECT
        id,
        copy_id
      FROM book_reservations
      WHERE book_id = $1
        AND status = 'siap_diambil'
        AND pickup_deadline <= NOW()
      ORDER BY pickup_deadline ASC, id ASC
      FOR UPDATE
    `,
    [bookId]
  );

  let expiredCount = 0;

  for (const reservation of expiredReservations.rows) {
    // -------------------------------------------------
    // Release copy only if it is still held.
    // -------------------------------------------------

    if (reservation.copy_id) {
      await client.query(
        `
          UPDATE book_copies
          SET
            status = 'tersedia',
            updated_at = NOW()
          WHERE id = $1
            AND status = 'ditahan'
        `,
        [reservation.copy_id]
      );
    }

    // -------------------------------------------------
    // Mark reservation expired.
    // -------------------------------------------------

    const expirationUpdate = await client.query(
      `
        UPDATE book_reservations
        SET
          status = 'kedaluwarsa',
          expired_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
          AND status = 'siap_diambil'
          AND pickup_deadline <= NOW()
      `,
      [reservation.id]
    );

    expiredCount += expirationUpdate.rowCount;
  }

  // =====================================================
  // 3. ALLOCATE WAITING QUEUE
  // =====================================================

  let allocatedCount = 0;

  while (true) {
    // -------------------------------------------------
    // Find the first waiting reservation.
    // -------------------------------------------------

    const waitingReservation = await client.query(
      `
        SELECT
          id,
          member_id,
          book_id
        FROM book_reservations
        WHERE book_id = $1
          AND status = 'menunggu'
        ORDER BY reserved_at ASC, id ASC
        LIMIT 1
        FOR UPDATE
      `,
      [bookId]
    );

    if (!waitingReservation.rowCount) {
      break;
    }

    const reservation = waitingReservation.rows[0];

    // -------------------------------------------------
    // Find an available copy.
    // -------------------------------------------------

    const availableCopy = await client.query(
      `
        SELECT id
        FROM book_copies
        WHERE book_id = $1
          AND status = 'tersedia'
        ORDER BY id ASC
        LIMIT 1
        FOR UPDATE
      `,
      [bookId]
    );

    if (!availableCopy.rowCount) {
      break;
    }

    const copyId = availableCopy.rows[0].id;

    // -------------------------------------------------
    // Set pickup deadline.
    // -------------------------------------------------

    const deadlineResult = await client.query(
      `
        SELECT NOW() + INTERVAL '3 days'
        AS pickup_deadline
      `
    );

    const pickupDeadline =
      deadlineResult.rows[0].pickup_deadline;

    // -------------------------------------------------
    // Change copy status.
    // -------------------------------------------------

    const copyUpdate = await client.query(
      `
        UPDATE book_copies
        SET
          status = 'ditahan',
          updated_at = NOW()
        WHERE id = $1
          AND book_id = $2
          AND status = 'tersedia'
      `,
      [copyId, bookId]
    );

    if (!copyUpdate.rowCount) {
      throw new Error(
        "Eksemplar gagal dialokasikan. Silakan ulangi proses."
      );
    }

    // -------------------------------------------------
    // Update reservation.
    // -------------------------------------------------

    const reservationUpdate = await client.query(
      `
        UPDATE book_reservations
        SET
          status = 'siap_diambil',
          copy_id = $2,
          ready_at = NOW(),
          pickup_deadline = $3,
          processed_by = $4,
          updated_at = NOW()
        WHERE id = $1
          AND status = 'menunggu'
      `,
      [
        reservation.id,
        copyId,
        pickupDeadline,
        processedBy,
      ]
    );

    if (!reservationUpdate.rowCount) {
      throw new Error(
        "Reservasi berubah selama proses alokasi."
      );
    }

    allocatedCount++;
  }

  // =====================================================
  // 4. RETURN RESULT
  // =====================================================

  return {
    allocated: allocatedCount,
    expired: expiredCount,
  };
}