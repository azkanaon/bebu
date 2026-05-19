-- Create book_stats table
CREATE TABLE IF NOT EXISTS book_stats (
    book_id BIGINT PRIMARY KEY,
    overall_rating NUMERIC(3,2) DEFAULT 0.00 NOT NULL,
    total_rating_sum INT DEFAULT 0 NOT NULL,
    total_reviews INT DEFAULT 0 NOT NULL,
    total_posts INT DEFAULT 0 NOT NULL,
    rating_1_count INT DEFAULT 0 NOT NULL,
    rating_2_count INT DEFAULT 0 NOT NULL,
    rating_3_count INT DEFAULT 0 NOT NULL,
    rating_4_count INT DEFAULT 0 NOT NULL,
    rating_5_count INT DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Key Constraint (Menghubungkan ke tabel books utama)
    CONSTRAINT fk_book_stats_book 
        FOREIGN KEY (book_id) 
        REFERENCES books(book_id) 
        ON DELETE CASCADE
);

-- Indexing untuk mempercepat sorting berdasarkan rating (misal fitur filter buku terpopuler)
CREATE INDEX IF NOT EXISTS idx_book_stats_overall_rating ON book_stats(overall_rating DESC);