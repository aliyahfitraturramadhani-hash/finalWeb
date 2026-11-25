-- ============================================================
-- BOOKLYN - Setup database sekali jalan
-- Jalankan dari DALAM folder DataBase:
--   psql -U postgres -d booklyn -f setup_all.sql
-- ============================================================
\set ON_ERROR_STOP on

\echo '>> 0/14 Membersihkan tabel lama (aman dijalankan ulang)'
DROP TABLE IF EXISTS book_reservations, extension_requests, announcements, book_categories CASCADE;

\echo '>> 1/14 Membuat tabel inti + akun awal'
\i booklyn.sql
\echo '>> 2/14 Tabel announcements dan extension_requests'
\i 02_additional_tables.sql
\echo '>> 3/14 Seed 25 buku + 50 eksemplar'
\i 03_seed_books.sql
\echo '>> 4/14 Kategori tambahan + relasi book_categories'
\i 04_book_categories.sql
\echo '>> 5/14 Migrasi kolom dan constraint'
\i 05_booklyn_migration.sql
\echo '>> 6/14 Migrasi status peminjaman'
\i 06_loan_status_migration.sql
\echo '>> 7/14 Tabel book_reservations'
\i migrations/20261123_create_book_reservations.sql
\echo '>> 8/14 Kolom copy_id reservasi'
\i migrations/20261123_reservation_copy_assignment.sql
\echo '>> 9/14 Guard eksemplar reservasi'
\i migrations/20261123_reservation_copy_guard.sql
\echo '>> 10/14 Migrasi nomor_identitas ke users'
\i migrations/20261125_move_nomor_identitas_to_users.sql
\echo '>> 11/14 Akun mahasiswa demo ke-2'
\i 07_seed_demo_member.sql
\echo '>> 12/14 Aturan pinjam default (durasi dan denda)'
\i 08_default_loan_rules.sql
\echo '>> 13/14 Dataset demo (peminjaman, denda, ulasan, pengumuman)'
\i seed/seed.sql
\echo '>> 14/14 Dataset demo reservasi'
\i 09_seed_book_reservations.sql
\echo '>> SELESAI. Database BOOKLYN siap dipakai.'
