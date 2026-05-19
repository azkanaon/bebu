CREATE TABLE IF NOT EXISTS book_daily_stats (
    book_daily_stat_id BIGSERIAL PRIMARY KEY,
    book_id BIGINT NOT NULL,
    date DATE NOT NULL, -- Menggunakan tipe DATE karena hanya mencatat statistik per hari (YYYY-MM-DD)
    total_posts INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Foreign Key ke tabel books utama
    CONSTRAINT fk_book_daily_stats_book 
        FOREIGN KEY (book_id) 
        REFERENCES books(book_id) 
        ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_book_id_date ON book_daily_stats(book_id, date);