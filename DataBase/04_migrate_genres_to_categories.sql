BEGIN;

-- 1. Rename tabel genres menjadi categories
ALTER TABLE genres
RENAME TO categories;

-- 2. Rename kolom nama_genre
ALTER TABLE categories
RENAME COLUMN nama_genre TO nama_kategori;

-- 3. Rename tabel book_genres
ALTER TABLE book_genres
RENAME TO book_categories;

-- 4. Rename kolom genre_id
ALTER TABLE book_categories
RENAME COLUMN genre_id TO category_id;

-- 5. Tambahkan kode klasifikasi
ALTER TABLE categories
ADD COLUMN kode_klasifikasi VARCHAR(50);

-- 6. Tambahkan deskripsi
ALTER TABLE categories
ADD COLUMN deskripsi TEXT;

-- 7. Pastikan kode klasifikasi unik
ALTER TABLE categories
ADD CONSTRAINT categories_kode_klasifikasi_unique
UNIQUE (kode_klasifikasi);

COMMIT;


