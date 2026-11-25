BEGIN;

-- =========================================
-- 1. TABLE CATEGORIES
-- =========================================

CREATE TABLE IF NOT EXISTS categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nama_kategori VARCHAR(100) NOT NULL UNIQUE,
    kode_klasifikasi VARCHAR(50) UNIQUE,
    deskripsi TEXT
);

-- =========================================
-- 2. TABLE BOOK CATEGORIES
-- =========================================

CREATE TABLE IF NOT EXISTS book_categories (
    book_id BIGINT NOT NULL
        REFERENCES books(id) ON DELETE CASCADE,

    category_id BIGINT NOT NULL
        REFERENCES categories(id) ON DELETE CASCADE,

    PRIMARY KEY (book_id, category_id)
);

-- =========================================
-- 3. INSERT CATEGORIES
-- =========================================

INSERT INTO categories (nama_kategori, kode_klasifikasi)
VALUES
    ('Anak dan Remaja', '810'),
    ('Fiksi', '800'),
    ('Non-Fiksi', '300'),
    ('Sains dan Teknologi', '500'),
    ('Sejarah', '900'),
    ('Fantasi', 'F01'),
    ('Adventure', 'F02'),
    ('Romance', 'F03'),
    ('Mystery', 'F04'),
    ('Drama', 'F05'),
    ('Contemporary', 'F06'),
    ('Young Adult', 'F07'),
    ('Coming of Age', 'F08'),
    ('Dystopian', 'F09'),
    ('Sci-Fi', 'F10'),
    ('Inspirational', 'F11'),
    ('Education', 'F12'),
    ('Fairy Tale', 'F13'),
    ('Music', 'F14'),
    ('Philosophical', 'F15'),
    ('Historical Fiction', 'F16'),
    ('Action', 'F17')
ON CONFLICT (nama_kategori) DO NOTHING;

-- =========================================
-- 4. ASSIGN MULTIPLE CATEGORIES TO BOOKS
-- =========================================

WITH category_mapping (judul, category_list) AS (
    VALUES

    ('Once Upon a Broken Heart',
        ARRAY['Fiksi','Fantasi','Romance','Adventure','Young Adult']),

    ('The Ballad of Never After',
        ARRAY['Fiksi','Fantasi','Romance','Adventure','Young Adult']),

    ('A Curse for True Love',
        ARRAY['Fiksi','Fantasi','Romance','Adventure','Young Adult']),

    ('Bumi',
        ARRAY['Fiksi','Anak dan Remaja','Fantasi','Adventure','Sci-Fi']),

    ('Bulan',
        ARRAY['Fiksi','Anak dan Remaja','Fantasi','Adventure','Sci-Fi']),

    ('Matahari',
        ARRAY['Fiksi','Anak dan Remaja','Fantasi','Adventure','Sci-Fi']),

    ('Surat untuk Jenaka',
        ARRAY['Fiksi','Romance','Drama','Contemporary','Coming of Age']),

    ('Kembali ke Batavia',
        ARRAY['Fiksi','Sejarah','Historical Fiction','Adventure','Mystery']),

    ('Mada',
        ARRAY['Fiksi','Sejarah','Historical Fiction','Romance','Drama']),

    ('About You',
        ARRAY['Fiksi','Romance','Contemporary','Drama','Young Adult']),

    ('Malioboro at Midnight',
        ARRAY['Fiksi','Romance','Contemporary','Drama','Young Adult']),

    ('The Secret of a Heart Note',
        ARRAY['Fiksi','Romance','Historical Fiction','Drama']),

    ('True Colors',
        ARRAY['Fiksi','Romance','Contemporary','Drama','Coming of Age']),

    ('Lotus in the Mud',
        ARRAY['Fiksi','Romance','Historical Fiction','Drama']),

    ('Hello, Cello.',
        ARRAY['Fiksi','Music','Romance','Contemporary','Coming of Age']),

    ('High Reputation',
        ARRAY['Fiksi','Romance','Contemporary','Drama','Young Adult']),

    ('Teka Teki Shaka',
        ARRAY['Fiksi','Mystery','Adventure','Young Adult']),

    ('Douglaslove',
        ARRAY['Fiksi','Romance','Contemporary','Drama']),

    ('Little Red Riding Hood',
        ARRAY['Fiksi','Anak dan Remaja','Fairy Tale','Fantasi','Adventure']),

    ('Perahu Kertas',
        ARRAY['Fiksi','Romance','Contemporary','Coming of Age','Drama']),

    ('Laskar Pelangi',
        ARRAY['Fiksi','Drama','Coming of Age','Inspirational','Education']),

    ('Negeri 5 Menara',
        ARRAY['Fiksi','Drama','Coming of Age','Inspirational','Education']),

    ('The Little Prince',
        ARRAY['Fiksi','Anak dan Remaja','Fantasi','Adventure','Philosophical']),

    ('The Hunger Games',
        ARRAY['Fiksi','Anak dan Remaja','Dystopian','Sci-Fi','Action','Adventure','Young Adult']),

    ('Wonder',
        ARRAY['Fiksi','Anak dan Remaja','Drama','Coming of Age','Inspirational'])

),

book_category_pairs AS (
    SELECT
        b.id AS book_id,
        c.id AS category_id
    FROM category_mapping cm
    JOIN books b
        ON LOWER(TRIM(b.judul)) = LOWER(TRIM(cm.judul))
    CROSS JOIN LATERAL UNNEST(cm.category_list) AS category_name
    JOIN categories c
        ON c.nama_kategori = category_name
    WHERE b.deleted_at IS NULL
)

INSERT INTO book_categories (book_id, category_id)
SELECT book_id, category_id
FROM book_category_pairs
ON CONFLICT DO NOTHING;

COMMIT;