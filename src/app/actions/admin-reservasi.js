"use server";

import { query, withTransaction } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { allocateAvailableCopiesToReservations } from "@/lib/reservasi/allocate";

// =====================================================
// GET RESERVATION QUEUE
// =====================================================

export async function getReservationQueue() {
  await getActiveUser("admin");

  const reservations = await query(`
    SELECT
      br.id,
      br.member_id,
      br.book_id,
      br.copy_id,
      br.status,
      br.queue_position,
      br.reserved_at,
      br.ready_at,
      br.pickup_deadline,
      br.completed_at,
      br.cancelled_at,
      br.expired_at,
      br.notes,

      m.nomor_anggota,

      u.nama AS nama_mahasiswa,
      u.email AS email_mahasiswa,

      b.judul,
      b.penulis,
      b.sampul,

      bc.kode_eksemplar,

      (
        SELECT COUNT(*)
        FROM book_copies bc2
        WHERE bc2.book_id = br.book_id
          AND bc2.status = 'tersedia'
      ) AS stok_tersedia

    FROM book_reservations br

    JOIN members m
      ON m.id = br.member_id

    JOIN users u
      ON u.id = m.user_id

    JOIN books b
      ON b.id = br.book_id

    LEFT JOIN book_copies bc
      ON bc.id = br.copy_id

    ORDER BY
      CASE
        WHEN br.status = 'menunggu' THEN 1
        WHEN br.status = 'siap_diambil' THEN 2
        WHEN br.status = 'selesai' THEN 3
        WHEN br.status = 'kedaluwarsa' THEN 4
        WHEN br.status = 'dibatalkan' THEN 5
        ELSE 6
      END,
      br.reserved_at ASC,
      br.id ASC
  `);

  return reservations;
}

// =====================================================
// MARK RESERVATION AS READY
// =====================================================

export async function markReservationReady(reservationId) {
  const admin = await getActiveUser("admin");

  await withTransaction(async (client) => {
    // -------------------------------------------------
    // 1. Lock reservation
    // -------------------------------------------------

    const reservationResult = await client.query(
      `
      SELECT
        id,
        book_id,
        status
      FROM book_reservations
      WHERE id = $1
      FOR UPDATE
      `,
      [reservationId]
    );

    if (!reservationResult.rowCount) {
      throw new Error("Reservasi tidak ditemukan.");
    }

    const reservation = reservationResult.rows[0];

    if (reservation.status !== "menunggu") {
      throw new Error(
        "Reservasi tidak lagi berada dalam status menunggu."
      );
    }

    // -------------------------------------------------
    // 2. Lock book
    // -------------------------------------------------

    await client.query(
      `
      SELECT id
      FROM books
      WHERE id = $1
      FOR UPDATE
      `,
      [reservation.book_id]
    );

    // -------------------------------------------------
    // 3. Check first reservation in queue
    // -------------------------------------------------

    const firstQueueResult = await client.query(
      `
      SELECT id
      FROM book_reservations
      WHERE book_id = $1
        AND status = 'menunggu'
      ORDER BY reserved_at ASC, id ASC
      LIMIT 1
      FOR UPDATE
      `,
      [reservation.book_id]
    );

    if (
      !firstQueueResult.rowCount ||
      Number(firstQueueResult.rows[0].id) !==
        Number(reservationId)
    ) {
      throw new Error(
        "Reservasi ini belum menjadi antrean pertama."
      );
    }

    // -------------------------------------------------
    // 4. Find available copy
    // -------------------------------------------------

    const copyResult = await client.query(
      `
      SELECT id
      FROM book_copies
      WHERE book_id = $1
        AND status = 'tersedia'
      ORDER BY id ASC
      LIMIT 1
      FOR UPDATE
      `,
      [reservation.book_id]
    );

    if (!copyResult.rowCount) {
      throw new Error(
        "Tidak ada eksemplar tersedia untuk diproses."
      );
    }

    const copyId = copyResult.rows[0].id;

    // -------------------------------------------------
    // 5. Set pickup deadline
    // -------------------------------------------------

    const deadlineResult = await client.query(
      `
      SELECT
        NOW() + INTERVAL '3 days'
        AS pickup_deadline
      `
    );

    const deadline =
      deadlineResult.rows[0].pickup_deadline;

    // -------------------------------------------------
    // 6. Lock and reserve the copy
    // -------------------------------------------------

    await client.query(
      `
      UPDATE book_copies
      SET
        status = 'ditahan',
        updated_at = NOW()
      WHERE id = $1
      `,
      [copyId]
    );

    // -------------------------------------------------
    // 7. Update reservation
    // -------------------------------------------------

    await client.query(
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
      `,
      [
        reservationId,
        copyId,
        deadline,
        admin.id,
      ]
    );
  });

  revalidatePath("/admin/reservasi");
  revalidatePath("/mahasiswa/reservasi");
  revalidatePath("/mahasiswa/katalog");
  revalidatePath("/pegawai/sirkulasi");
  revalidatePath("/pegawai/antrean");

  return {
    success: true,
    message: "Buku berhasil disiapkan untuk reservasi.",
  };
}

// =====================================================
// CANCEL RESERVATION
// =====================================================

export async function cancelAdminReservation(reservationId) {
  const admin = await getActiveUser("admin");
  const id = Number(reservationId);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Reservasi tidak valid.");

  const result = await withTransaction(async (client) => {
    const reservationResult = await client.query(`
      SELECT id, book_id, copy_id, status
      FROM book_reservations
      WHERE id = $1
      FOR UPDATE
    `, [id]);
    if (!reservationResult.rowCount) throw new Error("Reservasi tidak ditemukan.");
    const reservation = reservationResult.rows[0];
    if (!["menunggu", "siap_diambil"].includes(reservation.status)) {
      throw new Error("Reservasi ini tidak dapat dibatalkan.");
    }

    // Lock buku untuk serialisasi semua perubahan antrean per buku.
    await client.query(`SELECT id FROM books WHERE id = $1 FOR UPDATE`, [reservation.book_id]);

    if (reservation.status === "siap_diambil" && reservation.copy_id) {
      await client.query(`
        UPDATE book_copies
        SET status = 'tersedia', updated_at = NOW()
        WHERE id = $1 AND status = 'ditahan'
      `, [reservation.copy_id]);
    }

    await client.query(`
      UPDATE book_reservations
      SET status = 'dibatalkan', cancelled_at = NOW(), processed_by = $2, updated_at = NOW()
      WHERE id = $1
    `, [id, admin.id]);

    // Normalisasi posisi antrean menunggu.
    const waiting = await client.query(`
      SELECT id FROM book_reservations
      WHERE book_id = $1 AND status = 'menunggu'
      ORDER BY reserved_at ASC, id ASC
    `, [reservation.book_id]);
    for (let i = 0; i < waiting.rows.length; i++) {
      await client.query(`UPDATE book_reservations SET queue_position = $2, updated_at = NOW() WHERE id = $1`, [waiting.rows[i].id, i + 1]);
    }

    // Jika eksemplar dilepas dari reservasi siap-diambil, berikan kepada antrean berikutnya.
    const allocation = reservation.status === "siap_diambil"
      ? await allocateAvailableCopiesToReservations(client, reservation.book_id, admin.id)
      : { allocated: 0, expired: 0 };
    return allocation;
  });

  revalidatePath("/admin/reservasi");
  revalidatePath("/mahasiswa/reservasi");
  revalidatePath("/mahasiswa/katalog");
  revalidatePath("/pegawai/reservasi");
  revalidatePath("/pegawai/sirkulasi");
  revalidatePath("/pegawai/antrean");
  return { success: true, message: "Reservasi berhasil dibatalkan.", ...result };
}

// =====================================================
// COMPLETE RESERVATION
// =====================================================

export async function completeReservation(reservationId) {
  const admin = await getActiveUser("admin");

  await withTransaction(async (client) => {
    const reservationResult = await client.query(
      `
      SELECT
        id,
        status
      FROM book_reservations
      WHERE id = $1
      FOR UPDATE
      `,
      [reservationId]
    );

    if (!reservationResult.rowCount) {
      throw new Error("Reservasi tidak ditemukan.");
    }

    if (
      reservationResult.rows[0].status !==
      "siap_diambil"
    ) {
      throw new Error(
        "Reservasi belum berada dalam status siap diambil."
      );
    }

    throw new Error(
      "Gunakan proses serah-terima sirkulasi untuk menyelesaikan reservasi."
    );
  });
}