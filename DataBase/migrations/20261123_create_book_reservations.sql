-- =====================================================
-- BOOKLYN: BOOK RESERVATION SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS book_reservations (
    id BIGSERIAL PRIMARY KEY,

    member_id BIGINT NOT NULL
        REFERENCES members(id)
        ON DELETE RESTRICT,

    book_id BIGINT NOT NULL
        REFERENCES books(id)
        ON DELETE RESTRICT,

    status VARCHAR(30) NOT NULL DEFAULT 'menunggu',

    queue_position INTEGER,

    reserved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    ready_at TIMESTAMP,

    pickup_deadline TIMESTAMP,

    completed_at TIMESTAMP,

    cancelled_at TIMESTAMP,

    expired_at TIMESTAMP,

    processed_by BIGINT
        REFERENCES users(id)
        ON DELETE SET NULL,

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT book_reservations_status_check
    CHECK (
        status IN (
            'menunggu',
            'siap_diambil',
            'selesai',
            'dibatalkan',
            'kedaluwarsa'
        )
    )
);


-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_book_reservations_book
ON book_reservations(book_id);


CREATE INDEX IF NOT EXISTS idx_book_reservations_member
ON book_reservations(member_id);


CREATE INDEX IF NOT EXISTS idx_book_reservations_status
ON book_reservations(status);


CREATE INDEX IF NOT EXISTS idx_book_reservations_queue
ON book_reservations(book_id, reserved_at);


CREATE INDEX IF NOT EXISTS idx_book_reservations_pickup_deadline
ON book_reservations(pickup_deadline);


-- =====================================================
-- PREVENT DUPLICATE ACTIVE RESERVATIONS
-- =====================================================

CREATE UNIQUE INDEX IF NOT EXISTS
idx_unique_active_reservation_member_book
ON book_reservations(member_id, book_id)
WHERE status IN (
    'menunggu',
    'siap_diambil'
);