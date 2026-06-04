-- MIGRATION DOWN
ALTER TABLE book_submissions DROP COLUMN IF EXISTS publication_year;