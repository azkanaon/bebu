-- 1. Sinkronisasi tabel 'book_stats'
-- Tambahkan kolom yang dibutuhkan untuk tracking popularitas dan engagement
ALTER TABLE book_stats 
ADD COLUMN IF NOT EXISTS total_readers INT DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS total_notes INT DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS hot_score NUMERIC(12, 4) DEFAULT 0.0 NOT NULL;

-- Index untuk mempercepat sortir pencarian buku terpopuler
CREATE INDEX IF NOT EXISTS idx_book_stats_hot_score ON book_stats(hot_score DESC);
-- Index tambahan untuk sortir rating jika dibutuhkan
CREATE INDEX IF NOT EXISTS idx_book_stats_overall_rating ON book_stats(overall_rating DESC);


-- 2. Sinkronisasi tabel 'user_stats'
-- Tambahkan hot_score untuk menentukan user mana yang paling 'trending'
ALTER TABLE user_stats 
ADD COLUMN IF NOT EXISTS hot_score NUMERIC(12, 4) DEFAULT 0.0 NOT NULL;

-- Index untuk mempercepat sortir pencarian user terpopuler
CREATE INDEX IF NOT EXISTS idx_user_stats_hot_score ON user_stats(hot_score DESC);


-- 3. Sinkronisasi tabel 'post_stats'
-- Pastikan hot_score memiliki index karena tabel post biasanya yang paling cepat membengkak
CREATE INDEX IF NOT EXISTS idx_post_stats_hot_score ON post_stats(hot_score DESC);


-- 4. Index Tambahan untuk Pencarian Teks (Full Text Search Optimization)
-- Agar query 'LIKE %query%' lebih ringan (menggunakan btree index pada lowercase)
CREATE INDEX IF NOT EXISTS idx_books_title_lower ON books (LOWER(title));
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_posts_description_lower ON posts (LOWER(description));