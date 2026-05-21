-- Hapus Index Pencarian Teks
DROP INDEX IF EXISTS idx_posts_description_lower;
DROP INDEX IF EXISTS idx_users_username_lower;
DROP INDEX IF EXISTS idx_books_title_lower;

-- Hapus Index dan Kolom pada post_stats
DROP INDEX IF EXISTS idx_post_stats_hot_score;

-- Hapus Index dan Kolom pada user_stats
DROP INDEX IF EXISTS idx_user_stats_hot_score;
ALTER TABLE user_stats DROP COLUMN IF EXISTS hot_score;

-- Hapus Index dan Kolom pada book_stats
DROP INDEX IF EXISTS idx_book_stats_overall_rating;
DROP INDEX IF EXISTS idx_book_stats_hot_score;
ALTER TABLE book_stats DROP COLUMN IF EXISTS hot_score;
ALTER TABLE book_stats DROP COLUMN IF EXISTS total_notes;
ALTER TABLE book_stats DROP COLUMN IF EXISTS total_readers;