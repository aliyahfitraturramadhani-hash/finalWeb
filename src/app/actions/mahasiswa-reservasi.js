"use server";

import { revalidatePath } from "next/cache";
import { withTransaction } from "@/lib/db";
import { query } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";

// =====================================================
// AJUKAN RESERVASI BUKU
// =====================================================

export async function createReservation(bookId) {
  const user = await getActiveUser("member");

  const id = Number(bookId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Buku yang dipilih tidak valid.");
  }

  const result = await withTransaction(async (client) => {
    // =================================================
    // 1. VALIDASI AKUN
    // =================================================

    const accountResult = await client.query(
      `
        SELECT status
        FROM users
        WHERE id = $1
          AND role = 'member'
      `,
      [user.id]
    );

    if (!accountResult.rowCount) {
      throw new Error("Akun anggota tidak ditemukan.");
    }

    if (accountResult.rows[0].status !== "active") {
      throw new Error("Akun kamu belum aktif.");
    }

    // =================================================
    // 2. CARI MEMBER
    // =================================================

    const memberResult = await client.query(
      `
        SELECT
          id,
          masa_berlaku,
          masa_berlaku < CURRENT_DATE AS kedaluwarsa
        FROM members
        WHERE user_id = $1
        FOR UPDATE
      `,
      [user.id]
    );

    if (!memberResult.rowCount) {
      throw new Error("Data anggota tidak ditemukan.");
    }

    const member = memberResult.rows[0];

    if (member.kedaluwarsa) {
      throw new Error(
        "Masa berlaku keanggotaan kamu telah berakhir."
      );
    }

    const memberId = member.id;

    // =================================================
    // 3. LOCK BUKU
    // =================================================

    const bookResult = await client.query(
      `
        SELECT
          id,
          judul
        FROM books
        WHERE id = $1
          AND deleted_at IS NULL
        FOR UPDATE
      `,
      [id]
    );

    if (!bookResult.rowCount) {
      throw new Error("Buku tidak ditemukan.");
    }

    const book = bookResult.rows[0];

    // =================================================
    // 4. CEK STOK
    // =================================================

    const stockResult = await client.query(
      `
        SELECT COUNT(*)::integer AS stok
        FROM book_copies
        WHERE book_id = $1
          AND status = 'tersedia'
      `,
      [id]
    );

    const stock = Number(stockResult.rows[0].stok);

    if (stock > 0) {
      throw new Error(
        "Buku masih tersedia. Silakan ajukan peminjaman melalui fitur peminjaman."
      );
    }

    // =================================================
    // 5. CEK TRANSAKSI AKTIF BUKU YANG SAMA
    // =================================================

    const activeLoanResult = await client.query(
      `
        SELECT COUNT(*)::integer AS jumlah
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
      `,
      [memberId, id]
    );

    if (Number(activeLoanResult.rows[0].jumlah) > 0) {
      throw new Error(
        "Kamu sudah memiliki transaksi aktif untuk buku ini."
      );
    }

    // =================================================
    // 6. CEK RESERVASI AKTIF YANG SUDAH ADA
    // =================================================

    const existingReservation = await client.query(
      `
        SELECT id
        FROM book_reservations
        WHERE member_id = $1
          AND book_id = $2
          AND status IN (
            'menunggu',
            'siap_diambil'
          )
        LIMIT 1
      `,
      [memberId, id]
    );

    if (existingReservation.rowCount > 0) {
      throw new Error(
        "Kamu sudah memiliki reservasi aktif untuk buku ini."
      );
    }

    // =================================================
    // 7. TENTUKAN POSISI ANTREAN
    // =================================================

    const queueResult = await client.query(
      `
        SELECT
          COUNT(*)::integer AS jumlah
        FROM book_reservations
        WHERE book_id = $1
          AND status = 'menunggu'
      `,
      [id]
    );

    const queuePosition =
      Number(queueResult.rows[0].jumlah) + 1;

    // =================================================
    // 8. SIMPAN RESERVASI
    // =================================================

    const reservationResult = await client.query(
      `
        INSERT INTO book_reservations (
          member_id,
          book_id,
          status,
          queue_position
        )
        VALUES (
          $1,
          $2,
          'menunggu',
          $3
        )
        RETURNING id, reserved_at
      `,
      [memberId, id, queuePosition]
    );

    return {
      reservationId: reservationResult.rows[0].id,
      queuePosition,
      bookTitle: book.judul,
    };
  });

  // =====================================================
  // 9. REVALIDATE
  // =====================================================

  revalidatePath("/mahasiswa");
  revalidatePath("/mahasiswa/katalog");
  revalidatePath("/mahasiswa/reservasi");
  revalidatePath("/admin/reservasi");
  revalidatePath("/pegawai");

  return {
    success: true,
    message: "Reservasi buku berhasil dibuat.",
    ...result,
  };
}


// =====================================================
// DAFTAR RESERVASI MAHASISWA
// =====================================================

export async function getMyReservations() {
  const user = await getActiveUser("member");

  const reservations = await query(
    `
      SELECT
        br.id,
        br.book_id,
        br.status,
        br.queue_position,
        br.reserved_at,
        br.ready_at,
        br.pickup_deadline,
        br.completed_at,
        br.cancelled_at,
        br.expired_at,

        b.judul AS title,
        b.penulis AS author,
        b.sampul AS cover_url,

        CASE
          WHEN br.status = 'menunggu' THEN
            (
              SELECT COUNT(*)::integer
              FROM book_reservations earlier
              WHERE earlier.book_id = br.book_id
                AND earlier.status = 'menunggu'
                AND earlier.reserved_at < br.reserved_at
            ) + 1

          ELSE NULL
        END AS queue_position

      FROM book_reservations br

      JOIN members m
        ON m.id = br.member_id

      JOIN books b
        ON b.id = br.book_id

      WHERE m.user_id = $1

      ORDER BY br.reserved_at DESC
    `,
    [user.id]
  );

  return reservations;
}


// =====================================================
// BATALKAN RESERVASI
// =====================================================

export async function cancelReservation(reservationId) {
  const user = await getActiveUser("member");
  const id = Number(reservationId);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Reservasi tidak valid.");

  const result = await withTransaction(async (client) => {
    const memberResult = await client.query(`SELECT id FROM members WHERE user_id = $1 FOR UPDATE`, [user.id]);
    if (!memberResult.rowCount) throw new Error("Data anggota tidak ditemukan.");
    const memberId = memberResult.rows[0].id;

    const reservationResult = await client.query(`
      SELECT id, book_id, status
      FROM book_reservations
      WHERE id = $1 AND member_id = $2
      FOR UPDATE
    `, [id, memberId]);
    if (!reservationResult.rowCount) throw new Error("Reservasi tidak ditemukan.");
    const reservation = reservationResult.rows[0];
    if (reservation.status !== "menunggu") {
      throw new Error("Mahasiswa hanya dapat membatalkan reservasi yang masih menunggu.");
    }

    // Lock buku untuk menjaga konsistensi antrean per buku.
    await client.query(`SELECT id FROM books WHERE id = $1 FOR UPDATE`, [reservation.book_id]);
    await client.query(`
      UPDATE book_reservations
      SET status = 'dibatalkan', cancelled_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND status = 'menunggu'
    `, [id]);

    const waiting = await client.query(`
      SELECT id FROM book_reservations
      WHERE book_id = $1 AND status = 'menunggu'
      ORDER BY reserved_at ASC, id ASC
    `, [reservation.book_id]);
    for (let i = 0; i < waiting.rows.length; i++) {
      await client.query(`UPDATE book_reservations SET queue_position = $2, updated_at = NOW() WHERE id = $1`, [waiting.rows[i].id, i + 1]);
    }
    return { success: true };
  });

  revalidatePath("/mahasiswa");
  revalidatePath("/mahasiswa/reservasi");
  revalidatePath("/admin/reservasi");
  revalidatePath("/pegawai/reservasi");
  return result;
}
