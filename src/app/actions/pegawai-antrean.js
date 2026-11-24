"use server";

import { query, withTransaction } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ==========================================
// MENGAMBIL DAFTAR ANTREAN PEMINJAMAN
// ==========================================
export async function getLoanRequests() {
  await getActiveUser("librarian");

  const requests = await query(`
    SELECT
      l.id,
      l.kode_pinjam,
      l.status,
      l.created_at,
      l.batas_ambil,
      l.catatan,

      m.id AS member_id,
      m.nomor_anggota,

      u.nama AS nama_mahasiswa,
      u.email AS email_mahasiswa

    FROM loans l

    JOIN members m
      ON m.id = l.member_id

    JOIN users u
      ON u.id = m.user_id

    WHERE l.status = 'menunggu_konfirmasi'

    ORDER BY l.created_at ASC
  `);

  return requests;
}

// ==========================================
// MENGAMBIL DETAIL BUKU DALAM PEMINJAMAN
// ==========================================
export async function getLoanRequestDetails(loanId) {
  await getActiveUser("librarian");

  const details = await query(
    `
    SELECT
      li.id AS loan_item_id,
      li.loan_id,
      li.copy_id,

      b.id AS book_id,
      b.judul,
      b.penulis,
      b.isbn,
      b.sampul

    FROM loan_items li

    JOIN book_copies bc
      ON bc.id = li.copy_id

    JOIN books b
      ON b.id = bc.book_id

    WHERE li.loan_id = $1

    ORDER BY b.judul ASC
    `,
    [loanId]
  );

  return details;
}

// ==========================================
// MENYETUJUI PENGAJUAN PEMINJAMAN
// ==========================================
export async function approveLoanRequest(loanId) {
  const employee = await getActiveUser("librarian");

  await withTransaction(async (client) => {
    // Memastikan pengajuan masih menunggu konfirmasi
    const loanResult = await client.query(
      `
      SELECT id, status
      FROM loans
      WHERE id = $1
      FOR UPDATE
      `,
      [loanId]
    );

    if (loanResult.rows.length === 0) {
      throw new Error("Pengajuan peminjaman tidak ditemukan.");
    }

    if (loanResult.rows[0].status !== "menunggu_konfirmasi") {
      throw new Error("Pengajuan ini sudah diproses.");
    }

    // Memastikan seluruh eksemplar masih ditahan
    const copiesResult = await client.query(
      `
      SELECT bc.id, bc.status
      FROM loan_items li
      JOIN book_copies bc ON bc.id = li.copy_id
      WHERE li.loan_id = $1
      FOR UPDATE
      `,
      [loanId]
    );

    if (copiesResult.rows.length === 0) {
      throw new Error("Detail buku dalam pengajuan tidak ditemukan.");
    }

    const unavailableCopy = copiesResult.rows.find(
      (copy) => copy.status !== "ditahan"
    );

    if (unavailableCopy) {
      throw new Error(
        "Status eksemplar tidak sesuai. Pengajuan tidak dapat disetujui."
      );
    }

    // Mengubah status pengajuan menjadi menunggu pengambilan
    await client.query(
      `
      UPDATE loans
      SET
        status = 'menunggu_pengambilan',
        processed_by = $2,
        updated_at = NOW()
      WHERE id = $1
      `,
      [loanId, employee.id]
    );
  });

  revalidatePath("/pegawai/antrean");
  revalidatePath("/pegawai");

  return {
    success: true,
    message: "Pengajuan berhasil disetujui.",
  };
}

// ==========================================
// MENOLAK PENGAJUAN PEMINJAMAN
// ==========================================
export async function rejectLoanRequest(loanId, reason) {
  const employee = await getActiveUser("librarian");

  const rejectionReason = reason?.trim();

  if (!rejectionReason) {
    throw new Error("Alasan penolakan wajib diisi.");
  }

  await withTransaction(async (client) => {
    // Mengunci data pengajuan
    const loanResult = await client.query(
      `
      SELECT id, status
      FROM loans
      WHERE id = $1
      FOR UPDATE
      `,
      [loanId]
    );

    if (loanResult.rows.length === 0) {
      throw new Error("Pengajuan peminjaman tidak ditemukan.");
    }

    if (loanResult.rows[0].status !== "menunggu_konfirmasi") {
      throw new Error("Pengajuan ini sudah diproses.");
    }

    // Mengambil eksemplar yang terkait dengan pengajuan
    const copiesResult = await client.query(
      `
      SELECT bc.id, bc.status
      FROM loan_items li
      JOIN book_copies bc ON bc.id = li.copy_id
      WHERE li.loan_id = $1
      FOR UPDATE
      `,
      [loanId]
    );

    // Mengembalikan eksemplar yang ditahan menjadi tersedia
    for (const copy of copiesResult.rows) {
      if (copy.status === "ditahan") {
        await client.query(
          `
          UPDATE book_copies
          SET status = 'tersedia'
          WHERE id = $1
          `,
          [copy.id]
        );
      }
    }

    // Mengubah status pengajuan menjadi dibatalkan
    await client.query(
      `
      UPDATE loans
      SET
        status = 'dibatalkan',
        processed_by = $2,
        alasan_penolakan = $3,
        updated_at = NOW()
      WHERE id = $1
      `,
      [loanId, employee.id, rejectionReason]
    );
  });

  revalidatePath("/pegawai/antrean");
  revalidatePath("/pegawai");

  return {
    success: true,
    message: "Pengajuan berhasil ditolak.",
  };
}

// ==========================================
// MENGAMBIL DAFTAR PEMINJAMAN MENUNGGU PENGAMBILAN
// ==========================================
export async function getLoansWaitingPickup() {
  await getActiveUser("librarian");

  const requests = await query(`
    SELECT
      l.id,
      l.kode_pinjam,
      l.status,
      l.created_at,
      l.batas_ambil,

      m.id AS member_id,
      m.nomor_anggota,

      u.nama AS nama_mahasiswa,
      u.email AS email_mahasiswa

    FROM loans l

    JOIN members m
      ON m.id = l.member_id

    JOIN users u
      ON u.id = m.user_id

    WHERE l.status = 'menunggu_pengambilan'

    ORDER BY l.updated_at ASC
  `);

  return requests;
}

// ==========================================
// PROSES SERAH-TERIMA PEMINJAMAN
// ==========================================
export async function processBookPickup(loanId) {
  const user = await getActiveUser("librarian");

  return await withTransaction(async (client) => {
    // 1. Lock transaksi peminjaman
    const loanResult = await client.query(
      `
      SELECT id, status
      FROM loans
      WHERE id = $1
      FOR UPDATE
      `,
      [loanId]
    );

    const loan = loanResult.rows[0];

    if (!loan) {
      throw new Error("Transaksi peminjaman tidak ditemukan.");
    }

    if (loan.status !== "menunggu_pengambilan") {
      throw new Error(
        "Transaksi ini tidak dapat diproses untuk serah-terima."
      );
    }

    // 2. Ambil detail eksemplar dan durasi buku
    const itemsResult = await client.query(
      `
      SELECT
        li.copy_id,
        bc.status AS status_copy,
        b.durasi_maksimal_pinjam_hari

      FROM loan_items li

      JOIN book_copies bc
        ON bc.id = li.copy_id

      JOIN books b
        ON b.id = bc.book_id

      WHERE li.loan_id = $1

      FOR UPDATE OF bc
      `,
      [loanId]
    );

    const items = itemsResult.rows;

    if (items.length === 0) {
      throw new Error(
        "Detail buku dalam transaksi tidak ditemukan."
      );
    }

    // 3. Validasi seluruh eksemplar
    for (const item of items) {
      if (item.status_copy !== "ditahan") {
        throw new Error(
          "Status eksemplar buku tidak sesuai untuk serah-terima."
        );
      }

      if (
        !item.durasi_maksimal_pinjam_hari ||
        item.durasi_maksimal_pinjam_hari <= 0
      ) {
        throw new Error(
          "Durasi peminjaman buku belum ditentukan."
        );
      }
    }

    // 4. Tentukan tanggal pinjam dan jatuh tempo
    const tanggalPinjam = new Date();

    const durasiMaksimal = Math.max(
      ...items.map(
        (item) => item.durasi_maksimal_pinjam_hari
      )
    );

    const jatuhTempo = new Date(tanggalPinjam);

    jatuhTempo.setDate(
      jatuhTempo.getDate() + durasiMaksimal
    );

    // 5. Ubah status seluruh eksemplar
    for (const item of items) {
      await client.query(
        `
        UPDATE book_copies
        SET status = 'dipinjam',
            updated_at = NOW()
        WHERE id = $1
        `,
        [item.copy_id]
      );
    }

    // 6. Update transaksi peminjaman
    await client.query(
      `
      UPDATE loans
      SET status = 'sedang_dipinjam',
          tanggal_pinjam = $2,
          jatuh_tempo = $3,
          processed_by = $4,
          updated_at = NOW()
      WHERE id = $1
      `,
      [
        loanId,
        tanggalPinjam,
        jatuhTempo,
        user.id,
      ]
    );

    return {
      success: true,
      message: "Serah-terima buku berhasil diproses.",
    };
  });
}

// ==========================================
// PENCARIAN TRANSAKSI UNTUK PENGEMBALIAN
// ==========================================
export async function searchActiveLoans(keyword = "") {
  await getActiveUser("librarian");

  const searchTerm = `%${keyword.trim()}%`;

  const loans = await query(
    `
    SELECT
      l.id,
      l.kode_pinjam,
      l.status,
      l.tanggal_pinjam,
      l.jatuh_tempo,

      m.id AS member_id,
      m.nomor_anggota,

      u.nama AS nama_mahasiswa,
      u.email AS email_mahasiswa

    FROM loans l

    JOIN members m
      ON m.id = l.member_id

    JOIN users u
      ON u.id = m.user_id

    WHERE
      l.status = 'sedang_dipinjam'
      AND (
        l.kode_pinjam ILIKE $1
        OR m.nomor_anggota ILIKE $1
        OR u.nama ILIKE $1
        OR u.email ILIKE $1
      )

    ORDER BY l.jatuh_tempo ASC
    `,
    [searchTerm]
  );

  return loans;
}