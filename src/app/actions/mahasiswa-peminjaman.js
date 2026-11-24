"use server";

import { revalidatePath } from "next/cache";
import { withTransaction } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";

// ==========================================
// AJUKAN PEMINJAMAN
// ==========================================

export async function requestLoan(bookIds) {
  const user = await getActiveUser("member");

  const ids = [...new Set((bookIds || []).map(Number))];

  if (
    ids.length === 0 ||
    ids.some((id) => !Number.isInteger(id) || id <= 0)
  ) {
    throw new Error("Pilih buku yang valid.");
  }

  if (ids.length > 3) {
    throw new Error("Maksimal 3 buku dalam satu pengajuan.");
  }

  const result = await withTransaction(async (client) => {
    // ==========================================
    // 1. CEK STATUS AKUN
    // ==========================================

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
      throw new Error(
        "Akun kamu belum aktif. Peminjaman hanya dapat dilakukan oleh anggota dengan akun aktif."
      );
    }

    // ==========================================
    // 2. CARI DAN LOCK MEMBER
    // ==========================================

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
    const memberId = member.id;

    // ==========================================
    // 3. CEK MASA BERLAKU KEANGGOTAAN
    // ==========================================

    if (member.kedaluwarsa === true) {
      throw new Error(
        "Masa berlaku keanggotaan kamu sudah berakhir. Silakan perpanjang keanggotaan terlebih dahulu."
      );
    }

    // ==========================================
    // 4. CEK DENDA TERTUNGGAK
    // ==========================================

    const fineResult = await client.query(
      `
        SELECT
          COUNT(*) AS jumlah_denda,
          COALESCE(SUM(f.jumlah_denda), 0) AS total_denda
        FROM fines f
        JOIN loan_items li
          ON li.id = f.loan_item_id
        JOIN loans l
          ON l.id = li.loan_id
        WHERE l.member_id = $1
          AND f.status = 'belum_dibayar'
      `,
      [memberId]
    );

    const jumlahDenda = Number(
      fineResult.rows[0].jumlah_denda || 0
    );

    const totalDenda = Number(
      fineResult.rows[0].total_denda || 0
    );

    if (jumlahDenda > 0) {
      throw new Error(
        `Pengajuan peminjaman tidak dapat dilakukan karena kamu memiliki ${jumlahDenda} denda tertunggak sebesar Rp ${totalDenda.toLocaleString("id-ID")}. Selesaikan denda terlebih dahulu.`
      );
    }

    // ==========================================
    // 5. LOCK BOOKS
    // ==========================================

    const lockedBooksResult = await client.query(
      `
        SELECT id
        FROM books
        WHERE id = ANY($1::bigint[])
          AND deleted_at IS NULL
        ORDER BY id
        FOR UPDATE
      `,
      [ids]
    );

    if (lockedBooksResult.rowCount !== ids.length) {
      throw new Error(
        "Salah satu buku tidak ditemukan atau sudah tidak tersedia dalam katalog."
      );
    }

    // ==========================================
    // 6. CEK ANTREAN RESERVASI
    // ==========================================

    const reservationQueueResult = await client.query(
      `
        SELECT
          book_id,
          COUNT(*) AS jumlah_antrean
        FROM book_reservations
        WHERE book_id = ANY($1::bigint[])
          AND status = 'menunggu'
        GROUP BY book_id
      `,
      [ids]
    );

    const booksWithQueue = reservationQueueResult.rows;

    if (booksWithQueue.length > 0) {
      const queueBookIds = booksWithQueue.map(
        (row) => Number(row.book_id)
      );

      const queueBookResult = await client.query(
        `
          SELECT judul
          FROM books
          WHERE id = ANY($1::bigint[])
        `,
        [queueBookIds]
      );

      const queueBookTitles = queueBookResult.rows
        .map((book) => book.judul)
        .join(", ");

      throw new Error(
        `Peminjaman langsung tidak dapat dilakukan untuk buku yang memiliki antrean reservasi aktif. Buku berikut sedang diprioritaskan untuk antrean reservasi: ${queueBookTitles}.`
      );
    }

    // ==========================================
    // 7. CEK TRANSAKSI AKTIF UNTUK BUKU SAMA
    // ==========================================

    const existing = await client.query(
      `
        SELECT b.judul
        FROM loans l
        JOIN loan_items li
          ON li.loan_id = l.id
        JOIN book_copies bc
          ON bc.id = li.copy_id
        JOIN books b
          ON b.id = bc.book_id
        WHERE l.member_id = $1
          AND l.status IN (
            'menunggu_konfirmasi',
            'menunggu_pengambilan',
            'sedang_dipinjam'
          )
          AND bc.book_id = ANY($2::bigint[])
      `,
      [memberId, ids]
    );

    if (existing.rowCount > 0) {
      throw new Error(
        "Kamu sudah memiliki transaksi aktif untuk salah satu buku yang dipilih."
      );
    }

    // ==========================================
    // 8. CEK BATAS TOTAL BUKU AKTIF
    // ==========================================

    const activeLoanResult = await client.query(
      `
        SELECT COUNT(li.id) AS jumlah_buku_aktif
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
      [memberId]
    );

    const jumlahBukuAktif = Number(
      activeLoanResult.rows[0].jumlah_buku_aktif || 0
    );

    const jumlahBukuBaru = ids.length;
    const batasPeminjaman = 3;

    if (jumlahBukuAktif + jumlahBukuBaru > batasPeminjaman) {
      const sisaSlot = Math.max(
        0,
        batasPeminjaman - jumlahBukuAktif
      );

      throw new Error(
        `Batas peminjaman maksimal 3 buku aktif. Kamu saat ini memiliki ${jumlahBukuAktif} buku aktif dan hanya dapat mengajukan ${sisaSlot} buku lagi.`
      );
    }

    // ==========================================
    // 9. CARI DAN LOCK EKSEMPLAR TERSEDIA
    // ==========================================

    const copiesResult = await client.query(
      `
        SELECT
          bc.id,
          bc.book_id
        FROM book_copies bc
        JOIN books b
          ON b.id = bc.book_id
        WHERE bc.book_id = ANY($1::bigint[])
          AND bc.status = 'tersedia'
          AND b.deleted_at IS NULL
        ORDER BY bc.book_id, bc.id
        FOR UPDATE OF bc
      `,
      [ids]
    );

    // ==========================================
    // 10. VALIDASI KETERSEDIAAN
    // ==========================================

    const availableByBook = new Map();

    for (const copy of copiesResult.rows) {
      if (!availableByBook.has(String(copy.book_id))) {
        availableByBook.set(String(copy.book_id), copy);
      }
    }

    for (const bookId of ids) {
      if (!availableByBook.has(String(bookId))) {
        throw new Error(
          "Salah satu buku yang dipilih tidak tersedia."
        );
      }
    }

    // ==========================================
    // 11. BUAT TRANSAKSI PEMINJAMAN
    // ==========================================

    const loanResult = await client.query(
      `
        INSERT INTO loans (
          kode_pinjam,
          member_id,
          status,
          batas_ambil
        )
        VALUES (
          'REQ-' || UPPER(
            SUBSTRING(
              MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT),
              1,
              12
            )
          ),
          $1,
          'menunggu_konfirmasi',
          CURRENT_TIMESTAMP + INTERVAL '3 days'
        )
        RETURNING id
      `,
      [memberId]
    );

    const loanId = loanResult.rows[0].id;

    // ==========================================
    // 12. SIMPAN ITEM PEMINJAMAN
    // ==========================================

    for (const bookId of ids) {
      const copy = availableByBook.get(String(bookId));

      await client.query(
        `
          INSERT INTO loan_items (
            loan_id,
            copy_id
          )
          VALUES ($1, $2)
        `,
        [loanId, copy.id]
      );

      // ==========================================
      // 13. TAHAN EKSEMPLAR
      // ==========================================

      const copyUpdate = await client.query(
        `
          UPDATE book_copies
          SET
            status = 'ditahan',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
            AND status = 'tersedia'
        `,
        [copy.id]
      );

      if (!copyUpdate.rowCount) {
        throw new Error(
          "Eksemplar tidak lagi tersedia. Silakan ulangi pengajuan."
        );
      }
    }

    return loanId;
  });

  // ==========================================
  // 14. REVALIDATE HALAMAN
  // ==========================================

  revalidatePath("/mahasiswa");
  revalidatePath("/mahasiswa/katalog");
  revalidatePath("/mahasiswa/buku");
  revalidatePath("/mahasiswa/peminjaman");
  revalidatePath("/mahasiswa/reservasi");
  revalidatePath("/pegawai");
  revalidatePath("/pegawai/antrean");
  revalidatePath("/pegawai/reservasi");
  revalidatePath("/admin/reservasi");

  return {
    success: true,
    message: "Pengajuan peminjaman berhasil dikirim.",
    loanId: result,
  };
}