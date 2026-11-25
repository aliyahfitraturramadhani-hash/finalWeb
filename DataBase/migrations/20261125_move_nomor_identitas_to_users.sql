BEGIN;

-- 1. Tambahkan nomor identitas ke tabel users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS nomor_identitas VARCHAR(30);

-- 2. Migrasikan data nomor identitas
-- dari tabel members ke users
UPDATE users u
SET nomor_identitas = m.nomor_identitas
FROM members m
WHERE m.user_id = u.id
  AND u.nomor_identitas IS NULL;

COMMIT;