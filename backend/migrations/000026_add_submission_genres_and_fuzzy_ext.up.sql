CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Buat tabel untuk menampung usulan genre dari user
CREATE TABLE book_submission_genres (
    book_submission_genre_id BIGSERIAL PRIMARY KEY,
    book_submission_id BIGINT NOT NULL,
    genre_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_book_submission_genres_submission
        FOREIGN KEY (book_submission_id)
        REFERENCES book_submissions(book_submission_id)
        ON DELETE CASCADE
);

-- 3. Tambahkan Index untuk mempercepat query
CREATE INDEX idx_book_submission_genres_submission 
    ON book_submission_genres(book_submission_id);

-- 4. Tambahkan Index Trigram pada tabel authors utama
-- Ini agar pencarian fuzzy 'H. Manampiring' vs 'Henry Manampiring' menjadi sangat cepat
CREATE INDEX idx_authors_name_trgm ON authors USING gin (author_name gin_trgm_ops);