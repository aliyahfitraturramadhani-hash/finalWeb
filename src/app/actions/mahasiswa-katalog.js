"use server";

import { query } from "@/lib/db";
import { getActiveUser } from "@/lib/auth";

export async function getStudentCatalog() {
  await getActiveUser("member");

  const books = await query(`
    SELECT
      b.id,
      b.judul,
      b.isbn,
      b.penulis,
      b.penerbit,
      b.deskripsi,
      b.sampul,
      b.tahun_terbit,
      b.durasi_maksimal_pinjam_hari,
      b.tarif_denda_harian,
      b.harga_pengganti,

      COALESCE(
        COUNT(DISTINCT bc.id) FILTER (
          WHERE bc.status = 'tersedia'
        ),
        0
      ) AS stok_tersedia,

      COALESCE(
        ARRAY_AGG(DISTINCT c.nama_kategori)
        FILTER (WHERE c.nama_kategori IS NOT NULL),
        ARRAY[]::TEXT[]
      ) AS kategori,

      COALESCE(
        AVG(r.rating),
        0
      ) AS rating_rata_rata,

      COUNT(DISTINCT r.id) AS jumlah_review

    FROM books b

    LEFT JOIN book_copies bc
      ON bc.book_id = b.id

    LEFT JOIN book_categories bcat
      ON bcat.book_id = b.id

    LEFT JOIN categories c
      ON c.id = bcat.category_id

    LEFT JOIN reviews r
      ON r.book_id = b.id

    WHERE b.deleted_at IS NULL

    GROUP BY b.id

    ORDER BY b.judul ASC
  `);

  return books;
}