-- ============================================================
-- BOOKLYN - Aturan pinjam default untuk semua buku
-- Tanpa durasi maksimal pinjam, Pegawai tidak bisa menyetujui
-- peminjaman ("Durasi peminjaman buku belum ditentukan").
-- Default: 7 hari pinjam, denda Rp1.000 per hari.
-- Bisa diubah per buku lewat menu Kelola Buku.
-- ============================================================
BEGIN;

UPDATE books
SET durasi_maksimal_pinjam_hari = 7
WHERE durasi_maksimal_pinjam_hari IS NULL;

UPDATE books
SET tarif_denda_harian = 1000
WHERE tarif_denda_harian IS NULL;

COMMIT;
