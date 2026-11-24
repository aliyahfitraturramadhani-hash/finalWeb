"use server";

import { getActiveUser } from "@/lib/auth";
import { query } from "@/lib/db";

// ==========================================
// AMBIL RIWAYAT PEMINJAMAN MAHASISWA
// ==========================================

export async function getLoanHistory() {
  const user = await getActiveUser("member");

  const result = await query(
    `
      SELECT
        l.id AS loan_id,
        l.kode_pinjam,
        l.status AS status_peminjaman,
        l.batas_ambil,
        l.tanggal_pinjam,
        l.jatuh_tempo,
        l.jumlah_perpanjangan,
        l.catatan,
        l.created_at AS tanggal_pengajuan,

        li.id AS loan_item_id,
        li.tanggal_kembali,
        li.kondisi_kembali,

        bc.kode_eksemplar,
        bc.kondisi AS kondisi_eksemplar,

        b.id AS book_id,
        b.judul,
        b.penulis,
        b.sampul,

        fine_data.jumlah_denda,
        fine_data.total_denda,
        fine_data.status_denda

      FROM members m

      JOIN loans l
        ON l.member_id = m.id

      JOIN loan_items li
        ON li.loan_id = l.id

      JOIN book_copies bc
        ON bc.id = li.copy_id

      JOIN books b
        ON b.id = bc.book_id

      LEFT JOIN (
        SELECT
          loan_item_id,
          COUNT(id) AS jumlah_denda,
          SUM(jumlah_denda) AS total_denda,
          STRING_AGG(DISTINCT status, ', ') AS status_denda
        FROM fines
        GROUP BY loan_item_id
      ) fine_data
        ON fine_data.loan_item_id = li.id

      WHERE m.user_id = $1

      ORDER BY l.created_at DESC, li.id ASC
    `,
    [user.id]
  );

  return result;
}