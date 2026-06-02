ALTER TABLE book_submission_authors 
ADD COLUMN author_id INT REFERENCES authors(author_id) ON DELETE SET NULL,
ALTER COLUMN author_name DROP NOT NULL; -- Nama jadi opsional jika ID ada

-- Tambahkan kolom ID ke tabel pengajuan genre
ALTER TABLE book_submission_genres 
ADD COLUMN genre_id INT REFERENCES genres(genre_id) ON DELETE SET NULL,
ALTER COLUMN genre_name DROP NOT NULL;