-- Kembalikan author_name menjadi wajib diisi
ALTER TABLE book_submission_authors
ALTER COLUMN author_name SET NOT NULL,
DROP COLUMN author_id;

-- Kembalikan genre_name menjadi wajib diisi
ALTER TABLE book_submission_genres
ALTER COLUMN genre_name SET NOT NULL,
DROP COLUMN genre_id;