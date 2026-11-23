import { query } from "@/lib/db";
import HomeExperience from "@/app/components/HomeExperience";
import {
  getPopularBooks,
  getPublishedAnnouncements,
} from "@/lib/announcements";

export const dynamic = "force-dynamic";

export default async function Home() {
  // =========================================
  // CATEGORIES WITH AVAILABLE BOOK DATA
  // =========================================

  const categories = await query(`
    SELECT
      c.id,
      c.nama_kategori,
      COUNT(DISTINCT b.id)::int AS jumlah_buku,
      'Temukan ' || COUNT(DISTINCT b.id)::text ||
      ' buku dalam kategori ini.' AS deskripsi
    FROM categories c
    INNER JOIN book_categories bc
      ON bc.category_id = c.id
    INNER JOIN books b
      ON b.id = bc.book_id
    WHERE b.deleted_at IS NULL
    GROUP BY c.id, c.nama_kategori
    HAVING COUNT(DISTINCT b.id) > 0
    ORDER BY c.nama_kategori
  `);

  // =========================================
  // BOOK DATA
  // =========================================

  const books = await query(`
    SELECT
      b.id,
      b.judul,
      b.penulis,
      b.sampul,
      COUNT(bc.id) FILTER (
        WHERE bc.status = 'tersedia'
      )::int AS stok_tersedia
    FROM books b
    LEFT JOIN book_copies bc
      ON bc.book_id = b.id
    WHERE b.deleted_at IS NULL
    GROUP BY b.id
    ORDER BY b.id
    LIMIT 25
  `);

  // =========================================
  // POPULAR BOOKS & LATEST ANNOUNCEMENTS
  // =========================================

  const popularBooks = await getPopularBooks(5);

  const announcementRows = await getPublishedAnnouncements(3);

  const announcements = announcementRows.map((item) => ({
    id: item.id,
    judul: item.judul,
    kategori: item.kategori,
    tanggal: item.tanggal,
    ringkasan:
      item.isi.length > 160
        ? `${item.isi.slice(0, 160).trim()}...`
        : item.isi,
  }));

  return (
    <HomeExperience
      categories={categories}
      books={books}
      popularBooks={popularBooks}
      announcements={announcements}
    />
  );
}