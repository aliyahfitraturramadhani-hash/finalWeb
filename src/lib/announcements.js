import { query } from "@/lib/db";

export {
  formatTanggalID,
  getAnnouncementCategoryLabel,
} from "@/lib/announcement-format";

const TANGGAL_SQL = `
  to_char(
    COALESCE(tanggal_rilis, published_at::date, created_at::date),
    'YYYY-MM-DD'
  )
`;

// Pengumuman Published yang sudah rilis (publik)
export async function getPublishedAnnouncements(limit = null) {
  const params = [];
  let limitSql = "";

  if (limit) {
    params.push(limit);
    limitSql = `LIMIT $${params.length}`;
  }

  return query(
    `
      SELECT
        id,
        judul,
        isi,
        kategori,
        ${TANGGAL_SQL} AS tanggal
      FROM announcements
      WHERE status = 'published'
        AND (tanggal_rilis IS NULL OR tanggal_rilis <= CURRENT_DATE)
      ORDER BY
        COALESCE(tanggal_rilis, published_at::date, created_at::date) DESC,
        published_at DESC NULLS LAST,
        created_at DESC
      ${limitSql}
    `,
    params
  );
}

export async function getPublishedAnnouncementById(id) {
  if (!/^\d+$/.test(String(id))) return null;

  const rows = await query(
    `
      SELECT
        id,
        judul,
        isi,
        kategori,
        ${TANGGAL_SQL} AS tanggal
      FROM announcements
      WHERE id = $1
        AND status = 'published'
        AND (tanggal_rilis IS NULL OR tanggal_rilis <= CURRENT_DATE)
    `,
    [id]
  );

  return rows[0] || null;
}

// 5 buku terpopuler berdasarkan jumlah transaksi peminjaman
export async function getPopularBooks(limit = 5) {
  return query(
    `
      SELECT
        b.id,
        b.judul,
        b.penulis,
        b.sampul,
        COUNT(li.id)::int AS jumlah_pinjam
      FROM books b
      JOIN book_copies bc
        ON bc.book_id = b.id
      JOIN loan_items li
        ON li.copy_id = bc.id
      JOIN loans l
        ON l.id = li.loan_id
      WHERE b.deleted_at IS NULL
        AND l.status IN (
          'menunggu_pengambilan',
          'sedang_dipinjam',
          'selesai'
        )
      GROUP BY b.id
      ORDER BY jumlah_pinjam DESC, b.judul ASC
      LIMIT $1
    `,
    [limit]
  );
}
