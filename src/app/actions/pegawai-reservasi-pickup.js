"use server";

import { withTransaction } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// =====================================================
// PROSES SERAH-TERIMA BUKU RESERVASI
// =====================================================

export async function processReservationPickup(
  reservationId
) {
  const employee = await getActiveUser("librarian");

  return await withTransaction(async (client) => {
    // -------------------------------------------------
    // 1. Lock reservation
    // -------------------------------------------------

    const reservationResult = await client.query(
      `
      SELECT
        br.id,
        br.member_id,
        br.book_id,
        br.copy_id,
        br.status,
        br.pickup_deadline,

        m.user_id,
        m.masa_berlaku

      FROM book_reservations br

      JOIN members m
        ON m.id = br.member_id

      WHERE br.id = $1

      FOR UPDATE OF br, m
      `,
      [reservationId]
    );

    if (!reservationResult.rowCount) {
      throw new Error("Reservasi tidak ditemukan.");
    }

    const reservation =
      reservationResult.rows[0];

    if (reservation.status !== "siap_diambil") {
      throw new Error(
        "Reservasi belum siap untuk serah-terima."
      );
    }

    if (!reservation.copy_id) {
      throw new Error(
        "Reservasi tidak memiliki eksemplar yang ditahan."
      );
    }

    // -------------------------------------------------
    // 2. Check pickup deadline
    // -------------------------------------------------

    const deadlineResult = await client.query(
      `
      SELECT
        $1::timestamp < NOW()
        AS expired
      `,
      [reservation.pickup_deadline]
    );

    if (deadlineResult.rows[0].expired) {
      throw new Error(
        "Batas waktu pengambilan reservasi telah berakhir."
      );
    }

    // -------------------------------------------------
    // 3. Check member account
    // -------------------------------------------------

    const accountResult = await client.query(
      `
      SELECT
        id,
        status
      FROM users
      WHERE id = $1
        AND role = 'member'
      FOR UPDATE
      `,
      [reservation.user_id]
    );

    if (!accountResult.rowCount) {
      throw new Error("Akun anggota tidak ditemukan.");
    }

    if (
      accountResult.rows[0].status !== "active"
    ) {
      throw new Error(
        "Akun mahasiswa tidak aktif."
      );
    }

    // -------------------------------------------------
    // 4. Check membership expiration
    // -------------------------------------------------

    if (
      reservation.masa_berlaku < new Date()
    ) {
      throw new Error(
        "Masa berlaku keanggotaan telah berakhir."
      );
    }

    // -------------------------------------------------
    // 5. Check outstanding fines
    // -------------------------------------------------

    const fineResult = await client.query(
      `
      SELECT
        COUNT(*) AS jumlah_denda,
        COALESCE(
          SUM(f.jumlah_denda),
          0
        ) AS total_denda

      FROM fines f

      JOIN loan_items li
        ON li.id = f.loan_item_id

      JOIN loans l
        ON l.id = li.loan_id

      WHERE l.member_id = $1
        AND f.status = 'belum_dibayar'
      `,
      [reservation.member_id]
    );

    const outstandingFineCount =
      Number(
        fineResult.rows[0].jumlah_denda || 0
      );

    if (outstandingFineCount > 0) {
      const outstandingFineTotal =
        Number(
          fineResult.rows[0].total_denda || 0
        );

      throw new Error(
        `Mahasiswa memiliki denda tertunggak sebesar Rp ${outstandingFineTotal.toLocaleString("id-ID")}.`
      );
    }

    // -------------------------------------------------
    // 6. Check active loan limit
    // -------------------------------------------------

    const activeLoanResult =
      await client.query(
        `
        SELECT
          COUNT(li.id)::integer
          AS jumlah_buku_aktif

        FROM loans l

        JOIN loan_items li
          ON li.loan_id = l.id

        WHERE l.member_id = $1
          AND l.status IN (
            'menunggu_konfirmasi',
            'menunggu_pengambilan',
            'sedang_dipinjam'
          )
        `,
        [reservation.member_id]
      );

    const activeBooks =
      Number(
        activeLoanResult.rows[0]
          .jumlah_buku_aktif || 0
      );

    if (activeBooks >= 3) {
      throw new Error(
        "Mahasiswa sudah mencapai batas maksimal 3 buku aktif."
      );
    }

    // -------------------------------------------------
    // 7. Check same book active transaction
    // -------------------------------------------------

    const existingLoanResult =
      await client.query(
        `
        SELECT l.id

        FROM loans l

        JOIN loan_items li
          ON li.loan_id = l.id

        JOIN book_copies bc
          ON bc.id = li.copy_id

        WHERE l.member_id = $1
          AND bc.book_id = $2
          AND l.status IN (
            'menunggu_konfirmasi',
            'menunggu_pengambilan',
            'sedang_dipinjam'
          )

        LIMIT 1
        `,
        [
          reservation.member_id,
          reservation.book_id,
        ]
      );

    if (existingLoanResult.rowCount > 0) {
      throw new Error(
        "Mahasiswa sudah memiliki transaksi aktif untuk buku ini."
      );
    }

    // -------------------------------------------------
    // 8. Lock allocated copy
    // -------------------------------------------------

    const copyResult = await client.query(
      `
      SELECT
        bc.id,
        bc.book_id,
        bc.status,
        b.durasi_maksimal_pinjam_hari

      FROM book_copies bc

      JOIN books b
        ON b.id = bc.book_id

      WHERE bc.id = $1
        AND bc.book_id = $2

      FOR UPDATE OF bc
      `,
      [
        reservation.copy_id,
        reservation.book_id,
      ]
    );

    if (!copyResult.rowCount) {
      throw new Error(
        "Eksemplar yang dialokasikan tidak ditemukan."
      );
    }

    const copy = copyResult.rows[0];

    if (copy.status !== "ditahan") {
      throw new Error(
        "Eksemplar reservasi tidak berada dalam status ditahan."
      );
    }

    const duration =
      Number(
        copy.durasi_maksimal_pinjam_hari
      );

    if (!duration || duration <= 0) {
      throw new Error(
        "Durasi maksimal peminjaman buku belum ditentukan."
      );
    }

    // -------------------------------------------------
    // 9. Create loan transaction
    // -------------------------------------------------

    const loanResult = await client.query(
      `
      INSERT INTO loans (
        kode_pinjam,
        member_id,
        status,
        tanggal_pinjam,
        jatuh_tempo,
        processed_by
      )
      VALUES (
        'RES-' || UPPER(
          SUBSTRING(
            MD5(
              RANDOM()::TEXT
              || CLOCK_TIMESTAMP()::TEXT
            ),
            1,
            12
          )
        ),
        $1,
        'sedang_dipinjam',
        NOW(),
        NOW() + ($2 * INTERVAL '1 day'),
        $3
      )
      RETURNING id
      `,
      [
        reservation.member_id,
        duration,
        employee.id,
      ]
    );

    const loanId =
      loanResult.rows[0].id;

    // -------------------------------------------------
    // 10. Create loan item
    // -------------------------------------------------

    await client.query(
      `
      INSERT INTO loan_items (
        loan_id,
        copy_id
      )
      VALUES ($1, $2)
      `,
      [
        loanId,
        reservation.copy_id,
      ]
    );

    // -------------------------------------------------
    // 11. Update copy status
    // -------------------------------------------------

    await client.query(
      `
      UPDATE book_copies
      SET
        status = 'dipinjam',
        updated_at = NOW()
      WHERE id = $1
      `,
      [reservation.copy_id]
    );

    // -------------------------------------------------
    // 12. Complete reservation
    // -------------------------------------------------

    await client.query(
      `
      UPDATE book_reservations
      SET
        status = 'selesai',
        completed_at = NOW(),
        processed_by = $2,
        updated_at = NOW()
      WHERE id = $1
      `,
      [
        reservationId,
        employee.id,
      ]
    );

    // -------------------------------------------------
    // 13. Return transaction result
    // -------------------------------------------------

    return {
      success: true,
      loanId,
      message:
        "Serah-terima buku reservasi berhasil diproses.",
    };
  });
}

// =====================================================
// REVALIDATE
// =====================================================

export async function refreshReservationPickupPages() {
  revalidatePath("/admin/reservasi");
  revalidatePath("/mahasiswa/reservasi");
  revalidatePath("/mahasiswa");
  revalidatePath("/pegawai");
  revalidatePath("/pegawai/sirkulasi");
  revalidatePath("/pegawai/antrean");
}