BEGIN;

-- 1. Perbarui batasan status loans
ALTER TABLE loans
DROP CONSTRAINT IF EXISTS loans_status_check;

ALTER TABLE loans
ADD CONSTRAINT loans_status_check
CHECK (
  status IN (
    'menunggu_konfirmasi',
    'menunggu_pengambilan',
    'sedang_dipinjam',
    'selesai',
    'dibatalkan'
  )
);

-- 2. Perbarui batasan status eksemplar
-- ditahan digunakan untuk buku yang sedang menunggu proses pengambilan
-- setelah pengajuan disetujui
-- (status ditahan sudah tersedia di schema awal)

COMMIT;