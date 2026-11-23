-- ============================================================
-- BOOKLYN - Seed Data Buku
-- 25 Buku + 50 Eksemplar
-- PostgreSQL
-- ============================================================

BEGIN;

-- TEMPORARY TABLE UNTUK DATA BUKU
CREATE TEMP TABLE seed_books (
    category_name VARCHAR(100),
    isbn VARCHAR(20),
    judul VARCHAR(200),
    penulis VARCHAR(150),
    penerbit VARCHAR(150),
    tahun_terbit SMALLINT,
    deskripsi TEXT,
    sampul TEXT
) ON COMMIT DROP;

INSERT INTO seed_books VALUES

-- 1
('Anak dan Remaja', NULL,
'Once Upon a Broken Heart',
'Stephanie Garber',
'Flatiron Books', 2021,
'Evangeline Fox percaya pada cinta sejati. Ia membuat kesepakatan dengan Jacks untuk menghentikan sebuah pernikahan, tetapi justru terlibat dalam dunia sihir dengan harga yang tidak terduga.',
'/images/books/once-upon-a-broken-heart-stephanie-garber.jpg'),

-- 2
('Anak dan Remaja', NULL,
'The Ballad of Never After',
'Stephanie Garber',
'Flatiron Books', 2022,
'Sekuel Once Upon a Broken Heart. Setelah dikhianati Jacks, Evangeline terpaksa bekerja sama dengannya ketika kekuatan sihir berbahaya mulai bangkit.',
'/images/books/the-ballad-of-never-after-stephanie-garber.jpg'),

-- 3
('Anak dan Remaja', NULL,
'A Curse for True Love',
'Stephanie Garber',
'Flatiron Books', 2023,
'Evangeline terbangun dalam kehidupan dongeng yang tampak sempurna, tetapi ingatannya telah hilang. Ia harus menemukan kebenaran dan menentukan siapa yang pantas mendapatkan hatinya.',
'/images/books/a-curse-for-true-love-stephanie-garber.jpg'),

-- 4
('Anak dan Remaja', NULL,
'Bumi',
'Tere Liye',
'Gramedia Pustaka Utama', 2014,
'Raib memiliki kemampuan menghilang. Bersama Seli dan Ali, ia memasuki dunia paralel Klan Bulan dan memulai petualangan yang penuh misteri.',
'/images/books/bumi-tere-liyejpg.jpg'),

-- 5
('Anak dan Remaja', NULL,
'Bulan',
'Tere Liye',
'Gramedia Pustaka Utama', 2015,
'Raib, Seli, dan Ali mengikuti Miss Selena menuju Klan Matahari. Mereka menghadapi kompetisi berbahaya dan berbagai rahasia.',
'/images/books/bulan-tere-liye.jpg'),

-- 6
('Anak dan Remaja', NULL,
'Matahari',
'Tere Liye',
'Gramedia Pustaka Utama', 2016,
'Rasa ingin tahu Ali membawa mereka menjelajahi bagian dalam bumi dan menemukan Klan Bintang yang memiliki teknologi lebih maju.',
'/images/books/matahari-tere-liye.jpg'),

-- 7
('Fiksi', NULL,
'Surat untuk Jenaka',
'Gigrey',
'Akad', 2024,
'Jenaka, seorang mahasiswa hukum, melakukan perjalanan waktu ke Hindia Belanda tahun 1923. Ia bertemu Pramoedya muda dan mengungkap konspirasi pembunuhan.',
'/images/books/surat-untuk-jenaka-gigrey.jpg'),

-- 8
('Fiksi', NULL,
'Kembali ke Batavia',
'Gigrey',
'Akad', 2025,
'Dalam kelanjutan kisah Surat untuk Jenaka, Pram mengikuti Jenaka ke masa depan. Sebuah surat misterius membawa mereka kembali ke Batavia tahun 1930.',
'/images/books/kembali-ke-batavia-gigrey.jpg'),

-- 9
('Fiksi', NULL,
'Mada',
'Gigrey',
'Akad', 2021,
'Gendhis, seorang jurnalis muda, memasuki masa Majapahit dan bertemu Hayam Wuruk serta Gajah Mada dalam kisah cinta lintas waktu.',
'/images/books/mada-gigrey.jpg'),

-- 10
('Anak dan Remaja', NULL,
'About You',
'Visya Nabila',
'Cloud Books', 2024,
'Gavesha dan Bryan bertemu melalui ketertarikan terhadap musik Taylor Swift. Hubungan mereka berkembang, tetapi masa lalu dan luka emosional menjadi tantangan.',
'/images/books/about-you-visya-nabila.jpg'),

-- 11
('Anak dan Remaja', NULL,
'Malioboro at Midnight',
'SkySphiere',
'Bukune', 2023,
'Serana menghadapi hubungan jarak jauh yang rumit dengan Jan Ichard. Kehadiran Malioboro Hartigan membawa warna baru dalam kehidupannya.',
'/images/books/malioboro-at-midnight-skysphiere.jpg'),

-- 12
('Anak dan Remaja', NULL,
'The Secret of a Heart Note',
'Stacey Lee',
'Katherine Tegen Books', 2016,
'Mimosa berasal dari keluarga aromateur yang mampu membuat ramuan cinta melalui indra penciuman. Ketika sebuah ramuan gagal, ia harus memperbaiki semuanya.',
'/images/books/the-secret-of-a-heart-note-stacey-lee.jpg'),

-- 13
('Anak dan Remaja', NULL,
'True Colors',
'Gladys Cornelia',
'Rain Books', 2023,
'Britney, seorang mahasiswi populer, berteman dengan Gavin yang dianggap kutu buku. Hubungan mereka berkembang ketika keduanya menghadapi masa lalu.',
'/images/books/true-colors-gladys-cornelia.jpg'),

-- 14
('Anak dan Remaja', NULL,
'Lotus in the Mud',
'Annelie',
'Akad', 2022,
'Audine dan Ocean Abelvan bertemu sebagai model amatir. Keduanya menghadapi berbagai tantangan dan belajar berkembang seperti bunga teratai.',
'/images/books/lotus-in-the-mud-annelie.jpg'),

-- 15
('Anak dan Remaja', NULL,
'Hello, Cello.',
'Nadia Ristivani',
'Bukune', 2022,
'Helga, seorang penulis, bertemu Cello yang dikenal sebagai pria populer di kampus. Pertemuan mereka berkembang menjadi kisah romansa dan penyembuhan.',
'/images/books/hello-cello-nadia-restivani.jpg'),

-- 16
('Anak dan Remaja', NULL,
'High Reputation',
'Quinn',
'Bukune', 2022,
'Alisha, seorang model dan aktris, mendapat respons langsung dari pembalap idolanya, Haries Emerald. Kedekatan mereka menghadapi tekanan penggemar.',
'/images/books/high-reputation-quinn.jpg'),

-- 17
('Anak dan Remaja', NULL,
'Teka Teki Shaka',
'Zahira Aulia',
'Rain Books', 2024,
'Sabita Anasta telah menyukai Shaka Aditya Mahendra selama hampir tiga tahun. Ia berusaha memahami perasaan Shaka yang sulit ditebak.',
'/images/books/teka-teki-shaka-zahira-aulia.jpg'),

-- 18
('Anak dan Remaja', NULL,
'Douglaslove',
'Carlene Ann',
'Cloud Books', 2023,
'Javier, siswa berprestasi yang dingin, dipasangkan dengan Kayra yang ceria untuk olimpiade matematika. Dua kepribadian berbeda mulai saling memahami.',
'/images/books/doughslove-carlene-ann.jpg'),

-- 19
('Anak dan Remaja', NULL,
'Little Red Riding Hood',
'Ruwi Meita',
'Penerbit Haru', 2018,
'Adaptasi dongeng Little Red Riding Hood dengan nuansa misteri dan dark fairytale. Cerita menghadirkan sisi gelap dari kisah klasik tersebut.',
'/images/books/little-red-riding-hood-ruwi-meita.jpg'),

-- 20
('Fiksi', '9786022910527',
'Perahu Kertas',
'Dee Lestari',
'Bentang Pustaka', 2009,
'Kugy adalah gadis imajinatif yang gemar membuat dongeng, sedangkan Keenan merupakan pelukis berbakat. Pertemuan mereka membawa kisah cinta, persahabatan, dan impian.',
'/images/books/perahu-kertas-dee-lestari.jpg'),

-- 21
('Fiksi', '9786022916628',
'Laskar Pelangi',
'Andrea Hirata',
'Bentang Pustaka', 2005,
'Kisah sebelas anak Belitong yang berjuang mempertahankan sekolah dan mengejar pendidikan di tengah keterbatasan.',
'/images/books/laskar-pelangi-andrea-hirata.jpg'),

-- 22
('Fiksi', '9789792248616',
'Negeri 5 Menara',
'A. Fuadi',
'Gramedia Pustaka Utama', 2009,
'Alif belajar di Pondok Madani dan bersama lima sahabatnya menemukan makna persahabatan, kerja keras, serta keberanian mengejar impian.',
'/images/books/negeri-5-menara-ahmad-fuadi.jpg'),

-- 23
('Anak dan Remaja', '9781847498243',
'The Little Prince',
'Antoine de Saint-Exupéry',
'Alma Classics', 2019,
'Sebuah pilot yang terdampar di gurun bertemu pangeran kecil dari asteroid. Kisah ini membahas persahabatan, cinta, tanggung jawab, dan kehidupan.',
'/images/books/the-little-prince-antoine-de-saint-exupery.jpg'),

-- 24
('Anak dan Remaja', '9780439023481',
'The Hunger Games',
'Suzanne Collins',
'Scholastic Press', 2008,
'Katniss Everdeen hidup di Panem yang dikendalikan Capitol. Ia menjadi sukarelawan dalam kompetisi tahunan berbahaya demi menggantikan adiknya.',
'/images/books/the-hunger-games-suzanne-collins.jpg'),

-- 25
('Anak dan Remaja', '9781451758139',
'Wonder',
'R. J. Palacio',
'Alfred A. Knopf', 2012,
'Auggie Pullman mulai bersekolah di sekolah umum setelah lama belajar di rumah. Ia menghadapi tantangan pertemanan dan berharap orang lain melihat dirinya lebih dari penampilan.',
'/images/books/wonder-r-j-palacio.jpg');


-- MASUKKAN BUKU YANG BELUM ADA
INSERT INTO books (
    category_id,
    isbn,
    judul,
    penulis,
    penerbit,
    tahun_terbit,
    deskripsi,
    sampul
)
SELECT
    c.id,
    d.isbn,
    d.judul,
    d.penulis,
    d.penerbit,
    d.tahun_terbit,
    d.deskripsi,
    d.sampul
FROM seed_books d
JOIN categories c
    ON c.nama_kategori = d.category_name
WHERE NOT EXISTS (
    SELECT 1
    FROM books b
    WHERE LOWER(b.judul) = LOWER(d.judul)
      AND LOWER(b.penulis) = LOWER(d.penulis)
)
ON CONFLICT (isbn) DO NOTHING;


-- BUAT 2 EKSEMPLAR UNTUK SETIAP BUKU
-- Kode: BKL-0001-01, BKL-0001-02, dst.

INSERT INTO book_copies (
    book_id,
    kode_eksemplar
)
SELECT
    b.id,
    'BKL-' || LPAD(b.id::TEXT, 4, '0')
        || '-' || LPAD(n.nomor::TEXT, 2, '0')
FROM books b
JOIN seed_books d
    ON LOWER(b.judul) = LOWER(d.judul)
   AND LOWER(b.penulis) = LOWER(d.penulis)
CROSS JOIN generate_series(1, 2) AS n(nomor)
WHERE NOT EXISTS (
    SELECT 1
    FROM book_copies bc
    WHERE bc.kode_eksemplar =
        'BKL-' || LPAD(b.id::TEXT, 4, '0')
        || '-' || LPAD(n.nomor::TEXT, 2, '0')
);


COMMIT;


-- ============================================================
-- VERIFIKASI HASIL
-- ============================================================

SELECT
    COUNT(*) AS total_buku
FROM books
WHERE deleted_at IS NULL;

SELECT
    COUNT(*) AS total_eksemplar,
    COUNT(*) FILTER (WHERE status = 'tersedia') AS tersedia
FROM book_copies;

SELECT
    b.judul,
    b.penulis,
    c.nama_kategori,
    COUNT(bc.id) AS total_eksemplar,
    b.sampul
FROM books b
JOIN categories c ON c.id = b.category_id
LEFT JOIN book_copies bc ON bc.book_id = b.id
WHERE b.deleted_at IS NULL
GROUP BY b.id, c.nama_kategori
ORDER BY b.judul;