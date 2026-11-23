BEGIN;

-- ============================================
-- 1. BOOK MANAGEMENT
-- Durasi maksimal peminjaman dan tarif denda
-- ============================================

ALTER TABLE books
ADD COLUMN IF NOT EXISTS durasi_maksimal_pinjam_hari INTEGER;

ALTER TABLE books
ADD COLUMN IF NOT EXISTS tarif_denda_harian NUMERIC(12,2);


-- ============================================
-- 2. ANNOUNCEMENT MANAGEMENT
-- Kategori dan tanggal rilis pengumuman
-- ============================================

ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS kategori VARCHAR(30);

ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS tanggal_rilis DATE;

ALTER TABLE announcements
DROP CONSTRAINT IF EXISTS announcements_kategori_check;

ALTER TABLE announcements
ADD CONSTRAINT announcements_kategori_check
CHECK (
    kategori IS NULL
    OR kategori IN ('Operational', 'Service', 'Event')
);


-- ============================================
-- 3. CATEGORY MANAGEMENT
-- Kode klasifikasi wajib dan unik
-- ============================================

ALTER TABLE categories
ALTER COLUMN kode_klasifikasi SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
idx_categories_kode_klasifikasi_unique
ON categories (kode_klasifikasi);


-- ============================================
-- 4. STUDENT IDENTITY
-- Nomor identitas mahasiswa harus unik
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS
idx_members_nomor_identitas_unique
ON members (nomor_identitas);


-- ============================================
-- 5. ISBN VALIDATION
-- ISBN unik, data lama NULL tetap diperbolehkan
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS
idx_books_isbn_unique
ON books (LOWER(TRIM(isbn)))
WHERE isbn IS NOT NULL
AND TRIM(isbn) <> '';


-- ============================================
-- 6. LOAN STATUS
-- Menyesuaikan status dengan praktikum
-- ============================================

ALTER TABLE loans
DROP CONSTRAINT IF EXISTS loans_status_check;

ALTER TABLE loans
DROP CONSTRAINT IF EXISTS chk_loans_dipinjam;

ALTER TABLE loans
DROP CONSTRAINT IF EXISTS chk_loans_sedang_dipinjam;

ALTER TABLE loans
ADD CONSTRAINT loans_status_check
CHECK (
    status IN (
        'menunggu_konfirmasi',
        'sedang_dipinjam',
        'selesai',
        'ditolak'
    )
);

ALTER TABLE loans
ALTER COLUMN status
SET DEFAULT 'menunggu_konfirmasi';

ALTER TABLE loans
ADD CONSTRAINT chk_loans_sedang_dipinjam
CHECK (
    status NOT IN ('sedang_dipinjam', 'selesai')
    OR (
        tanggal_pinjam IS NOT NULL
        AND jatuh_tempo IS NOT NULL
    )
);


-- ============================================
-- 7. LOAN REJECTION
-- Alasan penolakan peminjaman
-- ============================================

ALTER TABLE loans
ADD COLUMN IF NOT EXISTS alasan_penolakan TEXT;


-- ============================================
-- MIGRATION SELESAI
-- ============================================

COMMIT;