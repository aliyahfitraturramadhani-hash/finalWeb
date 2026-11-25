-- ============================================================
-- BOOKLYN - DEMO DATA: BOOK RESERVATIONS
-- ============================================================

INSERT INTO book_reservations (
    id,
    member_id,
    book_id,
    copy_id,
    status,
    queue_position,
    reserved_at,
    ready_at,
    pickup_deadline,
    completed_at,
    cancelled_at,
    expired_at,
    processed_by,
    notes,
    created_at,
    updated_at
) VALUES

-- ============================================================
-- 1. RESERVATION: WAITING
-- Member BKL-0001 reserves Bumi
-- ============================================================
(
    7001,
    1,
    12,
    NULL,
    'menunggu',
    1,
    '2026-11-20 09:00:00',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'Reservasi baru, menunggu ketersediaan buku.',
    '2026-11-20 09:00:00',
    '2026-11-20 09:00:00'
),

-- ============================================================
-- 2. RESERVATION: WAITING
-- Member BKL-0002 reserves Matahari
-- ============================================================
(
    7002,
    5,
    14,
    NULL,
    'menunggu',
    1,
    '2026-11-20 10:00:00',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'Reservasi menunggu pemrosesan petugas.',
    '2026-11-20 10:00:00',
    '2026-11-20 10:00:00'
),

-- ============================================================
-- 3. RESERVATION: READY FOR PICKUP
-- Member BKL-0001 reserves The Ballad of Never After
-- ============================================================
(
    7003,
    1,
    10,
    28,
    'siap_diambil',
    NULL,
    '2026-11-19 09:00:00',
    '2026-11-21 10:00:00',
    '2026-11-25 10:00:00',
    NULL,
    NULL,
    NULL,
    2,
    'Buku telah disiapkan dan menunggu pengambilan.',
    '2026-11-19 09:00:00',
    '2026-11-21 10:00:00'
),

-- ============================================================
-- 4. RESERVATION: READY FOR PICKUP
-- Member BKL-0002 reserves Surat untuk Jenaka
-- ============================================================
(
    7004,
    5,
    15,
    37,
    'siap_diambil',
    NULL,
    '2026-11-19 11:00:00',
    '2026-11-21 11:00:00',
    '2026-11-25 11:00:00',
    NULL,
    NULL,
    NULL,
    2,
    'Buku telah disiapkan untuk anggota.',
    '2026-11-19 11:00:00',
    '2026-11-21 11:00:00'
),

-- ============================================================
-- 5. RESERVATION: COMPLETED
-- Member BKL-0001 successfully completed reservation
-- ============================================================
(
    7005,
    1,
    16,
    NULL,
    'selesai',
    NULL,
    '2026-11-10 09:00:00',
    '2026-11-11 09:00:00',
    '2026-11-15 09:00:00',
    '2026-11-13 14:00:00',
    NULL,
    NULL,
    2,
    'Reservasi selesai diproses.',
    '2026-11-10 09:00:00',
    '2026-11-13 14:00:00'
),

-- ============================================================
-- 6. RESERVATION: COMPLETED
-- Member BKL-0002 successfully completed reservation
-- ============================================================
(
    7006,
    5,
    18,
    NULL,
    'selesai',
    NULL,
    '2026-11-12 10:00:00',
    '2026-11-13 10:00:00',
    '2026-11-17 10:00:00',
    '2026-11-15 15:00:00',
    NULL,
    NULL,
    2,
    'Reservasi telah diselesaikan.',
    '2026-11-12 10:00:00',
    '2026-11-15 15:00:00'
),

-- ============================================================
-- 7. RESERVATION: CANCELLED
-- Member BKL-0001 cancelled reservation
-- ============================================================
(
    7007,
    1,
    19,
    NULL,
    'dibatalkan',
    NULL,
    '2026-11-14 09:00:00',
    NULL,
    NULL,
    NULL,
    '2026-11-15 12:00:00',
    NULL,
    NULL,
    'Reservasi dibatalkan oleh anggota.',
    '2026-11-14 09:00:00',
    '2026-11-15 12:00:00'
),

-- ============================================================
-- 8. RESERVATION: EXPIRED
-- Member BKL-0002 failed to collect prepared book
-- ============================================================
(
    7008,
    5,
    20,
    NULL,
    'kedaluwarsa',
    NULL,
    '2026-11-10 09:00:00',
    '2026-11-11 09:00:00',
    '2026-11-14 09:00:00',
    NULL,
    NULL,
    '2026-11-15 09:00:00',
    2,
    'Reservasi kedaluwarsa karena buku tidak diambil sesuai batas waktu.',
    '2026-11-10 09:00:00',
    '2026-11-15 09:00:00'
);