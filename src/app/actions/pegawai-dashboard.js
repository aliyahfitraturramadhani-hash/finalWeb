"use server";

import { query } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";

export async function getPegawaiDashboardData() {
  await getActiveUser("librarian");

  // STATISTIK DASHBOARD
  const statsQuery = `
    SELECT
      (
        SELECT COUNT(*)
        FROM loans
        WHERE status = 'menunggu_konfirmasi'
      ) AS antrean_pinjam,

      (
        SELECT COUNT(*)
        FROM loans
        WHERE status = 'sedang_dipinjam'
      ) AS sedang_dipinjam,

      (
        SELECT COUNT(*)
        FROM loans
        WHERE status = 'sedang_dipinjam'
          AND jatuh_tempo::date = CURRENT_DATE
      ) AS jatuh_tempo_hari_ini,

      (
        SELECT COALESCE(SUM(jumlah_denda), 0)
        FROM fines
        WHERE status = 'belum_dibayar'
      ) AS denda_tertunggak
  `;

  // ANTREAN VERIFIKASI PEMINJAMAN
  const queueQuery = `
    SELECT
      l.id,
      l.kode_pinjam,
      l.created_at,
      u.nama AS nama_mahasiswa,
      STRING_AGG(b.judul, ', ') AS daftar_buku
    FROM loans l
    JOIN members m ON m.id = l.member_id
    JOIN users u ON u.id = m.user_id
    JOIN loan_items li ON li.loan_id = l.id
    JOIN book_copies bc ON bc.id = li.copy_id
    JOIN books b ON b.id = bc.book_id
    WHERE l.status = 'menunggu_konfirmasi'
    GROUP BY l.id, l.kode_pinjam, l.created_at, u.nama
    ORDER BY l.created_at ASC
    LIMIT 10
  `;

  // ANTREAN PERPANJANGAN
  const extensionQuery = `
    SELECT
      er.id,
      er.tanggal_jatuh_tempo_baru,
      er.requested_at,
      u.nama AS nama_mahasiswa,
      STRING_AGG(b.judul, ', ') AS daftar_buku
    FROM extension_requests er
    JOIN loans l ON l.id = er.loan_id
    JOIN members m ON m.id = er.member_id
    JOIN users u ON u.id = m.user_id
    JOIN loan_items li ON li.loan_id = l.id
    JOIN book_copies bc ON bc.id = li.copy_id
    JOIN books b ON b.id = bc.book_id
    WHERE er.status = 'pending'
    GROUP BY
      er.id,
      er.tanggal_jatuh_tempo_baru,
      er.requested_at,
      u.nama
    ORDER BY er.requested_at ASC
    LIMIT 10
  `;

  // EKSEKUSI QUERY
  const [statsResult, queueResult, extensionResult] = await Promise.all([
    query(statsQuery),
    query(queueQuery),
    query(extensionQuery),
  ]);

  return {
    stats: statsResult[0],
    queue: queueResult,
    extensions: extensionResult,
  };
}