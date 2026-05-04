ALTER TABLE reading_activity_logs
DROP COLUMN total_likes,
DROP COLUMN total_comments,
DROP COLUMN total_posts,
DROP COLUMN total_notes;


-- 2. Hapus tabel 'user_stats'
DROP TABLE IF EXISTS user_stats;


-- 1. Hapus tabel 'notes'
DROP TABLE IF EXISTS notes;