-- ============================================================
-- BOOKLYN - Akun mahasiswa demo ke-2 (member id = 5)
-- Dibutuhkan oleh seed/seed.sql dan 09_seed_book_reservations.sql
-- Password: Booklyn123!
-- ============================================================
BEGIN;

INSERT INTO users (nama, email, password_hash, no_hp, role, status, nomor_identitas)
VALUES ('Mahasiswa Booklyn', 'mahasiswa@unhas.ac.id',
        '$2b$10$SPHhqf/VKvDz7VbEn5dxNOP/dL.Tvh94xGaT6HmygdyaxWQVSx29e',
        '081200000005', 'member', 'active', '7371000000000005');

INSERT INTO members (id, user_id, nomor_anggota, nomor_identitas, alamat, masa_berlaku)
SELECT 5, id, 'BKL-0002', '7371000000000005', 'Makassar', CURRENT_DATE + INTERVAL '1 year'
FROM users WHERE email = 'mahasiswa@unhas.ac.id';

COMMIT;
