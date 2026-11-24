"use server";

import { query } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";

export async function getStudentBookDetail(bookId) {
  await getActiveUser("member");

  const id = Number(bookId);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  const books = await query(
    `
      SELECT
        b.id,
        b.isbn,
        b.judul,
        b.penulis,
        b.penerbit,
        b.tahun_terbit,
        b.deskripsi,
        b.sampul,
        b.lokasi_rak,
        b.harga_pengganti,
        b.durasi_maksimal_pinjam_hari,
        b.tarif_denda_harian,

        COALESCE(
          COUNT(DISTINCT bc.id)
          FILTER (WHERE bc.status = 'tersedia'),
          0
        ) AS stok_tersedia,

        COALESCE(
          ARRAY_AGG(DISTINCT c.nama_kategori)
          FILTER (WHERE c.nama_kategori IS NOT NULL),
          ARRAY[]::TEXT[]
        ) AS kategori,

        COALESCE(MAX(r.rating_rata_rata), 0) AS rating_rata_rata,
        COALESCE(MAX(r.jumlah_review), 0) AS jumlah_review

      FROM books b

      LEFT JOIN book_copies bc
        ON bc.book_id = b.id

      LEFT JOIN book_categories bcat
        ON bcat.book_id = b.id

      LEFT JOIN categories c
        ON c.id = bcat.category_id

      LEFT JOIN (
        SELECT
          book_id,
          AVG(rating) AS rating_rata_rata,
          COUNT(*) AS jumlah_review
        FROM reviews
        GROUP BY book_id
      ) r
        ON r.book_id = b.id

      WHERE b.id = $1
        AND b.deleted_at IS NULL

      GROUP BY b.id

      LIMIT 1
    `,
    [id]
  );

  if (!books || books.length === 0) {
    return null;
  }

  const book = books[0];

  const reviews = await query(
    `
      SELECT
        r.rating,
        r.komentar,
        r.created_at,
        u.nama AS nama_pengulas

      FROM reviews r

      LEFT JOIN members m
        ON m.id = r.member_id

      LEFT JOIN users u
        ON u.id = m.user_id

      WHERE r.book_id = $1

      ORDER BY r.created_at DESC
    `,
    [id]
  );

  return {
    ...book,
    reviews: reviews || [],
  };
}