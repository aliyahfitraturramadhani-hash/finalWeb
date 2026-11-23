-- ============================================================
-- BOOKLYN - DEMO DATASET SEED
-- INSERT statements only. No SELECT, UPDATE, DELETE, or checks.
-- Assumes the baseline BOOKLYN schema/data and fixed IDs below.
-- ============================================================

-- Loans (explicit loan IDs and member IDs: 1=BKL-0001, 5=BKL-0002)
INSERT INTO loans (id, kode_pinjam, member_id, processed_by, status, batas_ambil, tanggal_pinjam, jatuh_tempo, jumlah_perpanjangan, catatan) VALUES
(1001,'DEMO-P-001',1,NULL,'menunggu_konfirmasi','2026-11-23 17:00:00+08',NULL,NULL,0,'Dataset demo BOOKLYN'),
(1002,'DEMO-P-002',5,NULL,'menunggu_konfirmasi','2026-11-23 17:00:00+08',NULL,NULL,0,'Dataset demo BOOKLYN'),
(1003,'DEMO-P-003',1,NULL,'menunggu_konfirmasi','2026-11-23 17:00:00+08',NULL,NULL,0,'Dataset demo BOOKLYN'),
(1004,'DEMO-A-001',5,2,'sedang_dipinjam','2026-11-23 17:00:00+08','2026-11-17','2026-11-24',0,'Dataset demo BOOKLYN'),
(1005,'DEMO-A-002',1,2,'sedang_dipinjam','2026-11-23 17:00:00+08','2026-11-18','2026-11-25',0,'Dataset demo BOOKLYN'),
(1006,'DEMO-A-003',5,2,'sedang_dipinjam','2026-11-23 17:00:00+08','2026-11-19','2026-12-03',1,'Dataset demo BOOKLYN'),
(1007,'DEMO-O-001',1,2,'sedang_dipinjam','2026-11-23 17:00:00+08','2026-11-03','2026-11-10',0,'Dataset demo BOOKLYN'),
(1008,'DEMO-O-002',5,2,'sedang_dipinjam','2026-11-23 17:00:00+08','2026-11-08','2026-11-15',0,'Dataset demo BOOKLYN'),
(1009,'DEMO-C-001',1,2,'selesai','2026-11-23 17:00:00+08','2026-11-05','2026-11-12',0,'Dataset demo BOOKLYN'),
(1010,'DEMO-C-002',5,2,'selesai','2026-11-23 17:00:00+08','2026-10-31','2026-11-07',0,'Dataset demo BOOKLYN'),
(1011,'DEMO-C-003',1,2,'selesai','2026-11-23 17:00:00+08','2026-11-08','2026-11-15',0,'Dataset demo BOOKLYN');

-- Loan items. copy_id values assume the baseline copy IDs are 25-35.
INSERT INTO loan_items (id, loan_id, copy_id, tanggal_kembali, kondisi_kembali) VALUES
(2001,1001,25,NULL,NULL),
(2002,1002,26,NULL,NULL),
(2003,1003,27,NULL,NULL),
(2004,1004,28,NULL,NULL),
(2005,1005,29,NULL,NULL),
(2006,1006,30,NULL,NULL),
(2007,1007,31,NULL,NULL),
(2008,1008,32,NULL,NULL),
(2009,1009,33,'2026-11-13 12:00:00+08','baik'),
(2010,1010,34,'2026-11-08 12:00:00+08','baik'),
(2011,1011,35,'2026-11-16 12:00:00+08','baik');

-- Extension requests
INSERT INTO extension_requests (id, loan_id, member_id, alasan, tanggal_jatuh_tempo_lama, tanggal_jatuh_tempo_baru, status, processed_by, catatan_petugas, requested_at, processed_at) VALUES
(3001,1004,5,'[DEMO] Membutuhkan waktu tambahan untuk menyelesaikan bacaan.','2026-11-24','2026-12-01','pending',NULL,NULL,'2026-11-20 10:00:00+08',NULL),
(3002,1005,1,'[DEMO] Belum selesai membaca buku.','2026-11-25','2026-12-02','pending',NULL,NULL,'2026-11-20 10:05:00+08',NULL),
(3003,1006,5,'[DEMO] Sedang menyelesaikan tugas kuliah.','2026-11-26','2026-12-03','approved',2,'Dataset demo: perpanjangan disetujui.','2026-11-20 10:10:00+08','2026-11-20 10:15:00+08'),
(3004,1007,1,'[DEMO] Memerlukan tambahan waktu membaca.','2026-11-10','2026-11-17','rejected',2,'Dataset demo: perpanjangan ditolak.','2026-11-20 10:20:00+08','2026-11-20 10:25:00+08');

-- Fines
INSERT INTO fines (id, loan_item_id, jenis, hari_terlambat, tarif_per_hari, jumlah_denda, status, alasan_penghapusan, processed_by, dibayar_at, created_at) VALUES
(4001,2009,'terlambat',6,1000,6000,'belum_dibayar',NULL,NULL,NULL,'2026-11-20 10:30:00+08'),
(4002,2010,'terlambat',11,1000,11000,'lunas',NULL,2,'2026-11-20 10:35:00+08','2026-11-20 10:30:00+08'),
(4003,2011,'terlambat',3,1000,3000,'dihapuskan','Dataset demo: penghapusan denda sebagai simulasi kebijakan petugas.',2,NULL,'2026-11-20 10:40:00+08');

-- Reviews (book IDs assume baseline IDs 9-14)
INSERT INTO reviews (id, loan_item_id, book_id, member_id, rating, komentar, created_at) VALUES
(5001,2009,10,1,5,'Cerita yang sangat menarik! Alur ceritanya bikin penasaran dan sulit berhenti membaca.','2026-11-17 10:00:00+08'),
(5002,2010,11,5,4,'Bukunya bagus dan nyaman dibaca. Beberapa bagian terasa sedikit lambat, tetapi keseluruhan ceritanya memuaskan.','2026-11-18 10:00:00+08'),
(5003,2011,11,1,3,'Ceritanya cukup menarik, tetapi menurut saya perkembangan ceritanya bisa dibuat lebih baik.','2026-11-19 10:00:00+08');

-- Announcements
INSERT INTO announcements (id, judul, isi, status, created_by, published_at, kategori, tanggal_rilis, created_at, updated_at) VALUES
(6001,'[DEMO] Perubahan Jam Operasional Perpustakaan','Perpustakaan BOOKLYN menginformasikan perubahan jam operasional. Perpustakaan buka Senin hingga Jumat pukul 08.00–17.00 dan Sabtu pukul 09.00–14.00.','published',2,'2026-11-18 10:00:00+08','Operational','2026-11-18','2026-11-18 10:00:00+08','2026-11-18 10:00:00+08'),
(6002,'[DEMO] Pengingat Pengembalian Buku','Anggota diharapkan mengembalikan buku sebelum tanggal jatuh tempo. Keterlambatan pengembalian dapat dikenakan denda sesuai ketentuan perpustakaan.','published',2,'2026-11-19 10:00:00+08','Service','2026-11-19','2026-11-19 10:00:00+08','2026-11-19 10:00:00+08'),
(6003,'[DEMO] Reading Week BOOKLYN','BOOKLYN mengadakan Reading Week untuk mendorong kebiasaan membaca. Anggota dapat mengikuti kegiatan membaca bersama dan berbagi rekomendasi buku.','published',2,'2026-11-20 10:00:00+08','Event','2026-11-20','2026-11-20 10:00:00+08','2026-11-20 10:00:00+08'),
(6004,'[DEMO] Workshop Literasi Digital','Rencana kegiatan workshop literasi digital untuk anggota perpustakaan. Informasi jadwal dan pendaftaran akan diumumkan setelah persiapan selesai.','draft',2,NULL,'Event','2026-11-25','2026-11-20 10:00:00+08','2026-11-20 10:00:00+08'),
(6005,'[DEMO] Pemberitahuan Maintenance Sistem','Draft pemberitahuan pemeliharaan sistem BOOKLYN. Selama pemeliharaan, beberapa layanan digital mungkin tidak dapat digunakan.','draft',2,NULL,'Operational','2026-11-27','2026-11-20 10:00:00+08','2026-11-20 10:00:00+08'),
(6006,'[DEMO] Informasi Pendaftaran Anggota Baru','Pendaftaran anggota baru perpustakaan telah dibuka. Calon anggota dapat mendaftar melalui website BOOKLYN dan melengkapi persyaratan yang diperlukan.','archived',2,'2026-10-21 10:00:00+08','Service','2026-10-21','2026-10-21 10:00:00+08','2026-10-21 10:00:00+08'),
(6007,'[DEMO] Book Sharing Day','Kegiatan Book Sharing Day telah selesai dilaksanakan. Anggota berbagi pengalaman membaca dan rekomendasi buku favorit mereka.','archived',2,'2026-10-06 10:00:00+08','Event','2026-10-06','2026-10-06 10:00:00+08','2026-10-06 10:00:00+08');
