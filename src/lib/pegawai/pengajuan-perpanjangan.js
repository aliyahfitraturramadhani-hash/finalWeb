import { query } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";

export async function getPengajuanPerpanjangan() {
  await getActiveUser("librarian");

  const result = await query(`
    SELECT
      er.id,
      er.loan_id,
      er.member_id,
      er.alasan,
      er.tanggal_jatuh_tempo_lama,
      er.tanggal_jatuh_tempo_baru,
      er.status,
      er.processed_by,
      er.catatan_petugas,
      er.requested_at,
      er.processed_at,

      l.kode_pinjam,
      l.status AS status_peminjaman,

      u.nama AS nama_mahasiswa,
      u.email,

      STRING_AGG(b.judul, ', ' ORDER BY b.judul) AS judul_buku

    FROM extension_requests er

    JOIN loans l
      ON l.id = er.loan_id

    JOIN members m
      ON m.id = er.member_id

    JOIN users u
      ON u.id = m.user_id

    LEFT JOIN loan_items li
      ON li.loan_id = l.id

    LEFT JOIN book_copies bc
      ON bc.id = li.copy_id

    LEFT JOIN books b
      ON b.id = bc.book_id

    GROUP BY
      er.id,
      l.id,
      m.id,
      u.id

    ORDER BY
      CASE
        WHEN er.status = 'pending' THEN 0
        ELSE 1
      END,
      er.requested_at DESC
  `);

  return result;
}