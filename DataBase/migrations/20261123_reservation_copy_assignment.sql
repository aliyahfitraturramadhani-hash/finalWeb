-- =====================================================
-- BOOKLYN
-- RESERVATION COPY ASSIGNMENT
-- =====================================================

ALTER TABLE book_reservations
ADD COLUMN IF NOT EXISTS copy_id BIGINT
REFERENCES book_copies(id)
ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_book_reservations_copy_id
ON book_reservations(copy_id);