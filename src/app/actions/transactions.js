"use server";

import { query } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";

async function requireAdmin() {
  return await getActiveUser("admin");
}

export async function getTransactions() {
  await requireAdmin();

  const result = await query(`
    SELECT
      l.id,
      l.kode_pinjam,
      l.status,
      l.batas_ambil,
      l.tanggal_pinjam,
      l.jatuh_tempo,
      l.jumlah_perpanjangan,
      l.catatan,
      l.alasan_penolakan,
      l.created_at,

      u.nama AS nama_mahasiswa,
      u.email AS email_mahasiswa,

      m.nomor_anggota,
      m.nomor_identitas,

      processor.nama AS nama_petugas,

      COALESCE(items.daftar_buku, '[]'::json) AS daftar_buku,
      COALESCE(items.jumlah_buku, 0) AS jumlah_buku,

      COALESCE(fines.total_denda, 0) AS total_denda,
      COALESCE(fines.denda_belum_dibayar, 0) AS denda_belum_dibayar,
      COALESCE(fines.denda_lunas, 0) AS denda_lunas,

      extension.status_perpanjangan,
      extension.jumlah_pengajuan_perpanjangan

    FROM loans l

    JOIN members m
      ON m.id = l.member_id

    JOIN users u
      ON u.id = m.user_id

    LEFT JOIN users processor
      ON processor.id = l.processed_by

    LEFT JOIN LATERAL (
      SELECT
        COUNT(li.id)::integer AS jumlah_buku,

        JSON_AGG(
          JSON_BUILD_OBJECT(
            'loan_item_id', li.id,
            'book_id', b.id,
            'judul', b.judul,
            'penulis', b.penulis,
            'sampul', b.sampul,
            'kode_eksemplar', bc.kode_eksemplar,
            'tanggal_kembali', li.tanggal_kembali,
            'kondisi_kembali', li.kondisi_kembali
          )
          ORDER BY b.judul
        ) AS daftar_buku

      FROM loan_items li

      JOIN book_copies bc
        ON bc.id = li.copy_id

      JOIN books b
        ON b.id = bc.book_id

      WHERE li.loan_id = l.id
    ) items ON TRUE

    LEFT JOIN LATERAL (
      SELECT
        COALESCE(SUM(f.jumlah_denda), 0) AS total_denda,

        COALESCE(
          SUM(f.jumlah_denda)
          FILTER (WHERE f.status = 'belum_dibayar'),
          0
        ) AS denda_belum_dibayar,

        COALESCE(
          SUM(f.jumlah_denda)
          FILTER (WHERE f.status = 'lunas'),
          0
        ) AS denda_lunas

      FROM loan_items li

      JOIN fines f
        ON f.loan_item_id = li.id

      WHERE li.loan_id = l.id
    ) fines ON TRUE

    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::integer AS jumlah_pengajuan_perpanjangan,

        (
          SELECT er.status
          FROM extension_requests er
          WHERE er.loan_id = l.id
          ORDER BY er.requested_at DESC
          LIMIT 1
        ) AS status_perpanjangan

      FROM extension_requests er

      WHERE er.loan_id = l.id
    ) extension ON TRUE

    ORDER BY l.created_at DESC
  `);

  return result.map((transaction) => ({
    ...transaction,

    id: String(transaction.id),

    jumlah_buku: Number(transaction.jumlah_buku),

    total_denda: Number(transaction.total_denda),
    denda_belum_dibayar: Number(transaction.denda_belum_dibayar),
    denda_lunas: Number(transaction.denda_lunas),

    jumlah_pengajuan_perpanjangan: Number(
      transaction.jumlah_pengajuan_perpanjangan
    ),

    daftar_buku: transaction.daftar_buku || [],
  }));
}

export async function getTransactionSummary() {
  await requireAdmin();

  const result = await query(`
    SELECT
      COUNT(*)::integer AS total_transaksi,

      COUNT(*) FILTER (
        WHERE status = 'menunggu_konfirmasi'
      )::integer AS menunggu_konfirmasi,

      COUNT(*) FILTER (
        WHERE status = 'sedang_dipinjam'
      )::integer AS sedang_dipinjam,

      COUNT(*) FILTER (
        WHERE status = 'selesai'
      )::integer AS selesai,

      COUNT(*) FILTER (
        WHERE status = 'ditolak'
      )::integer AS ditolak,

      COUNT(*) FILTER (
        WHERE status = 'sedang_dipinjam'
          AND jatuh_tempo < CURRENT_DATE
      )::integer AS terlambat

    FROM loans
  `);

  const fines = await query(`
    SELECT
      COALESCE(SUM(jumlah_denda), 0) AS total_denda,

      COALESCE(
        SUM(jumlah_denda)
        FILTER (WHERE status = 'belum_dibayar'),
        0
      ) AS belum_dibayar,

      COALESCE(
        SUM(jumlah_denda)
        FILTER (WHERE status = 'lunas'),
        0
      ) AS lunas

    FROM fines
  `);

  return {
    ...result[0],

    total_denda: Number(fines[0].total_denda),
    denda_belum_dibayar: Number(fines[0].belum_dibayar),
    denda_lunas: Number(fines[0].lunas),
  };
}