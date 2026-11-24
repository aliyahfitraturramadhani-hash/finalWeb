import { query } from "@/lib/db";
import KatalogExperience from "@/app/components/KatalogExperience";

export const dynamic = "force-dynamic";

export default async function KatalogPage() {
  const books = await query(`
    SELECT
      b.id,
      b.judul,
      b.penulis,
      b.penerbit,
      b.tahun_terbit,
      b.deskripsi,
      b.sampul,
      b.lokasi_rak,
      b.harga_pengganti,

      COALESCE((
        SELECT ROUND(AVG(r.rating)::numeric, 1)
        FROM reviews r
        WHERE r.book_id = b.id
      ), 0)::float AS rating_rata_rata,

      (
        SELECT COUNT(*)
        FROM reviews r
        WHERE r.book_id = b.id
      )::int AS jumlah_review,

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

    WHERE b.deleted_at IS NULL

    GROUP BY b.id

    ORDER BY b.id
  `);

  const categories = await query(`
    SELECT
      id,
      nama_kategori
    FROM categories
    ORDER BY nama_kategori
  `);

  return (
    <KatalogExperience
      books={books}
      categories={categories}
    />
  );
}