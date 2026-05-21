ALTER TABLE search_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Buat constraint agar kombinasi user_id dan query_text unik
-- Ini agar saat user cari "Hobbit" lagi, kita tinggal update waktu-nya saja, bukan buat baris baru.
ALTER TABLE search_logs ADD CONSTRAINT user_query_unique UNIQUE (user_id, query_text);