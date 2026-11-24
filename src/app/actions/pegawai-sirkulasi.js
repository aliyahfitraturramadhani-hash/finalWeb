"use server";

import { query } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";

async function requireCirculationAccess() {
  return await getActiveUser([
    "admin",
    "librarian",
  ]);
}

export async function getCirculationData(keyword = "") {
  await requireCirculationAccess();

  const search = keyword?.trim() || "";

  const items = await query(
    `
    SELECT
      l.id AS loan_id,
      l.kode_pinjam,
      l.status,
      l.tanggal_pinjam,
      l.jatuh_tempo,

      m.nomor_anggota,

      u.nama AS nama_mahasiswa,

      b.id AS book_id,
      b.judul,
      b.penulis,

      bc.id AS copy_id,
      bc.kode_eksemplar,

      li.id AS loan_item_id,
      li.tanggal_kembali,
      li.kondisi_kembali,

      CASE
        WHEN li.tanggal_kembali IS NOT NULL
          THEN 0

        WHEN l.jatuh_tempo::date < CURRENT_DATE
          THEN CURRENT_DATE - l.jatuh_tempo::date

        ELSE 0
      END AS hari_terlambat

    FROM loans l

    JOIN members m
      ON m.id = l.member_id

    JOIN users u
      ON u.id = m.user_id

    JOIN loan_items li
      ON li.loan_id = l.id

    JOIN book_copies bc
      ON bc.id = li.copy_id

    JOIN books b
      ON b.id = bc.book_id

WHERE
(
  (
    l.status = 'sedang_dipinjam'
    AND li.tanggal_kembali IS NULL
  )

  OR

  (
    l.status = 'selesai'
    AND li.tanggal_kembali IS NOT NULL
  )
)

AND (
  $1 = ''

  OR m.nomor_anggota ILIKE $2
  OR u.nama ILIKE $2
  OR b.judul ILIKE $2
  OR b.penulis ILIKE $2
  OR bc.kode_eksemplar ILIKE $2
  OR l.kode_pinjam ILIKE $2
)

    ORDER BY
      CASE
        WHEN li.tanggal_kembali IS NULL
          THEN 0
        ELSE 1
      END,

      l.jatuh_tempo ASC,

      l.created_at DESC

    LIMIT 200
    `,
    [
      search,
      `%${search}%`,
    ]
  );

  const summary = await query(
    `
    SELECT

      COUNT(*) FILTER (
        WHERE l.status = 'sedang_dipinjam'
        AND li.tanggal_kembali IS NULL
      )::integer AS aktif,

      COUNT(*) FILTER (
        WHERE l.status = 'sedang_dipinjam'
        AND li.tanggal_kembali IS NULL
        AND l.jatuh_tempo::date < CURRENT_DATE
      )::integer AS terlambat,

      COUNT(*) FILTER (
        WHERE li.tanggal_kembali IS NOT NULL
      )::integer AS selesai,

      COUNT(*)::integer AS total

    FROM loans l

    JOIN loan_items li
      ON li.loan_id = l.id
    `
  );

  return {
    items,

    summary: {
      total: Number(summary[0].total || 0),
      aktif: Number(summary[0].aktif || 0),
      terlambat: Number(summary[0].terlambat || 0),
      selesai: Number(summary[0].selesai || 0),
    },
  };
}

export async function searchCirculation(keyword = "") {
  const data = await getCirculationData(keyword);

  return data.items;
}