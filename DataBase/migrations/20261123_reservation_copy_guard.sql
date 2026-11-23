-- =====================================================
-- BOOKLYN: RESERVATION COPY ALLOCATION GUARD
-- =====================================================

-- Mencegah satu eksemplar terikat ke lebih dari satu
-- reservasi aktif pada waktu yang sama.

CREATE UNIQUE INDEX IF NOT EXISTS
idx_unique_active_reservation_copy
ON book_reservations(copy_id)
WHERE copy_id IS NOT NULL
  AND status = 'siap_diambil';