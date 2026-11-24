"use server";

import { query } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";

export async function getAdminDashboardData() {
  await getActiveUser("admin");

  // 1. STATISTIK UTAMA
  const overviewResult = await query(`
    SELECT
      (
        SELECT COUNT(*)
        FROM books
        WHERE deleted_at IS NULL
      )::integer AS total_buku,

      (
        SELECT COUNT(*)
        FROM book_copies bc
        JOIN books b ON b.id = bc.book_id
        WHERE b.deleted_at IS NULL
      )::integer AS total_eksemplar,

      (
        SELECT COUNT(*)
        FROM users
        WHERE role = 'member'
      )::integer AS total_mahasiswa,

      (
        SELECT COUNT(*)
        FROM loans
        WHERE status IN (
          'menunggu_konfirmasi',
          'sedang_dipinjam'
        )
      )::integer AS transaksi_aktif,

      (
        SELECT COUNT(*)
        FROM loans
        WHERE status = 'menunggu_konfirmasi'
      )::integer AS menunggu_konfirmasi,

      (
        SELECT COUNT(*)
        FROM loans
        WHERE status = 'sedang_dipinjam'
      )::integer AS sedang_dipinjam,

      (
        SELECT COUNT(*)
        FROM loans
        WHERE status = 'sedang_dipinjam'
          AND jatuh_tempo < CURRENT_DATE
      )::integer AS peminjaman_terlambat,

      (
        SELECT COALESCE(SUM(jumlah_denda), 0)
        FROM fines
        WHERE status = 'lunas'
      ) AS total_denda_lunas
  `);

  // 2. GRAFIK PEMINJAMAN ENAM BULAN TERAKHIR
  const monthlyResult = await query(`
    WITH months AS (
      SELECT generate_series(
        date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
        date_trunc('month', CURRENT_DATE),
        INTERVAL '1 month'
      ) AS month_start
    )

    SELECT
      TO_CHAR(months.month_start, 'Mon') AS bulan,

      COALESCE(COUNT(loans.id), 0)::integer AS jumlah_peminjaman

    FROM months

    LEFT JOIN loans
      ON loans.created_at >= months.month_start
      AND loans.created_at < months.month_start + INTERVAL '1 month'

    GROUP BY months.month_start

    ORDER BY months.month_start
  `);

  // 3. DISTRIBUSI KATEGORI BUKU
  const categoryResult = await query(`
    SELECT
      c.id,
      c.nama_kategori,

      COUNT(DISTINCT b.id)::integer AS jumlah_buku

    FROM categories c

    LEFT JOIN book_categories bc
      ON bc.category_id = c.id

    LEFT JOIN books b
      ON b.id = bc.book_id
      AND b.deleted_at IS NULL

    GROUP BY c.id, c.nama_kategori

    ORDER BY jumlah_buku DESC, c.nama_kategori ASC
  `);

  // 4. AKTIVITAS TRANSAKSI TERBARU
  const recentResult = await query(`
    SELECT
      l.id,
      l.kode_pinjam,
      l.status,
      l.created_at,

      u.nama AS nama_mahasiswa,

      COUNT(li.id)::integer AS jumlah_buku,

      STRING_AGG(
        DISTINCT b.judul,
        ', '
        ORDER BY b.judul
      ) AS daftar_buku

    FROM loans l

    JOIN members m
      ON m.id = l.member_id

    JOIN users u
      ON u.id = m.user_id

    LEFT JOIN loan_items li
      ON li.loan_id = l.id

    LEFT JOIN book_copies bc
      ON bc.id = li.copy_id

    LEFT JOIN books b
      ON b.id = bc.book_id

    GROUP BY
      l.id,
      l.kode_pinjam,
      l.status,
      l.created_at,
      u.nama

    ORDER BY l.created_at DESC

    LIMIT 6
  `);

  // 5. TRANSAKSI YANG PERLU PERHATIAN
  const attentionResult = await query(`
    SELECT
      l.id,
      l.kode_pinjam,
      l.status,
      l.created_at,
      l.jatuh_tempo,

      u.nama AS nama_mahasiswa,

      CASE
        WHEN l.status = 'menunggu_konfirmasi'
          THEN 'Menunggu Konfirmasi'

        WHEN l.status = 'sedang_dipinjam'
          AND l.jatuh_tempo < CURRENT_DATE
          THEN 'Terlambat'

        ELSE 'Perlu Perhatian'
      END AS jenis_perhatian

    FROM loans l

    JOIN members m
      ON m.id = l.member_id

    JOIN users u
      ON u.id = m.user_id

    WHERE
      l.status = 'menunggu_konfirmasi'

      OR (
        l.status = 'sedang_dipinjam'
        AND l.jatuh_tempo < CURRENT_DATE
      )

    ORDER BY
      CASE
        WHEN l.status = 'menunggu_konfirmasi' THEN 1
        ELSE 2
      END,
      l.created_at ASC

    LIMIT 8
  `);

  const overview = overviewResult[0];

  return {
    overview: {
      total_buku: Number(overview.total_buku),
      total_eksemplar: Number(overview.total_eksemplar),
      total_mahasiswa: Number(overview.total_mahasiswa),
      transaksi_aktif: Number(overview.transaksi_aktif),
      menunggu_konfirmasi: Number(overview.menunggu_konfirmasi),
      sedang_dipinjam: Number(overview.sedang_dipinjam),
      peminjaman_terlambat: Number(overview.peminjaman_terlambat),
      total_denda_lunas: Number(overview.total_denda_lunas),
    },

    monthly: monthlyResult,

    categories: categoryResult.map((category) => ({
      ...category,
      jumlah_buku: Number(category.jumlah_buku),
    })),

    recent: recentResult.map((item) => ({
      ...item,
      id: String(item.id),
      jumlah_buku: Number(item.jumlah_buku),
    })),

    attention: attentionResult.map((item) => ({
      ...item,
      id: String(item.id),
    })),
  };
}