import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import BookDetailExperience from "@/app/components/BookDetailExperience";

export const dynamic = "force-dynamic";

export default async function BookDetailPage({ params }) {
  const { id } = await params;

  // ==========================================
  // GET BOOK DETAIL
  // ==========================================

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

        COUNT(DISTINCT bc.id) FILTER (
          WHERE bc.status = 'tersedia'
        )::int AS stok_tersedia,

        COUNT(DISTINCT bc.id)::int AS total_eksemplar,

        COALESCE(
          ARRAY_AGG(DISTINCT c.nama_kategori)
          FILTER (WHERE c.nama_kategori IS NOT NULL),
          ARRAY[]::varchar[]
        ) AS categories

      FROM books b

      LEFT JOIN book_copies bc
        ON bc.book_id = b.id

      LEFT JOIN book_categories bcat
        ON bcat.book_id = b.id

      LEFT JOIN categories c
        ON c.id = bcat.category_id

      WHERE b.id = $1
        AND b.deleted_at IS NULL

      GROUP BY b.id
    `,
    [id]
  );

  if (!books.length) {
    notFound();
  }

  const book = books[0];

  // ==========================================
  // GET BOOK RATINGS
  // ==========================================

  const ratingData = await query(
    `
      SELECT
        COUNT(*)::int AS total_ulasan,

        COALESCE(
          AVG(rating), 0
        )::numeric(3,2) AS rata_rating,

        COUNT(*) FILTER (
          WHERE rating = 5
        )::int AS bintang_5,

        COUNT(*) FILTER (
          WHERE rating = 4
        )::int AS bintang_4,

        COUNT(*) FILTER (
          WHERE rating = 3
        )::int AS bintang_3,

        COUNT(*) FILTER (
          WHERE rating = 2
        )::int AS bintang_2,

        COUNT(*) FILTER (
          WHERE rating = 1
        )::int AS bintang_1

      FROM reviews

      WHERE book_id = $1
    `,
    [id]
  );

  // ==========================================
  // GET BOOK REVIEWS
  // ==========================================

  const reviews = await query(
    `
      SELECT
        r.rating,
        r.komentar,
        r.created_at,
        u.nama AS nama_pengguna

      FROM reviews r

      JOIN members m
        ON m.id = r.member_id

      JOIN users u
        ON u.id = m.user_id

      WHERE r.book_id = $1

      ORDER BY r.created_at DESC

      LIMIT 5
    `,
    [id]
  );

  // ==========================================
  // GET RELATED BOOKS BASED ON CATEGORY
  // ==========================================

  const relatedBooks = await query(
    `
      SELECT
        b.id,
        b.judul,
        b.penulis,
        b.sampul

      FROM books b

      WHERE b.id <> $1

        AND b.deleted_at IS NULL

        AND EXISTS (
          SELECT 1
          FROM book_categories bcat1

          JOIN book_categories bcat2
            ON bcat1.category_id = bcat2.category_id

          WHERE bcat1.book_id = $1
            AND bcat2.book_id = b.id
        )

      ORDER BY b.id

      LIMIT 8
    `,
    [id]
  );

  // ==========================================
  // RENDER BOOK DETAIL
  // ==========================================

  return (
    <BookDetailExperience
      book={book}
      rating={ratingData[0]}
      reviews={reviews}
      relatedBooks={relatedBooks}
    />
  );
}