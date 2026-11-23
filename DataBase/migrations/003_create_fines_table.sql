CREATE TABLE fines (
    id BIGSERIAL PRIMARY KEY,

    loan_item_id BIGINT NOT NULL UNIQUE
        REFERENCES loan_items(id),

    jumlah_hari_terlambat INTEGER NOT NULL DEFAULT 0
        CHECK (jumlah_hari_terlambat >= 0),

    tarif_per_hari NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (tarif_per_hari >= 0),

    jumlah_denda NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (jumlah_denda >= 0),

    status VARCHAR(20) NOT NULL DEFAULT 'tertunggak'
        CHECK (status IN ('tertunggak', 'lunas')),

    tanggal_pembayaran TIMESTAMPTZ,

    dicatat_oleh BIGINT
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);