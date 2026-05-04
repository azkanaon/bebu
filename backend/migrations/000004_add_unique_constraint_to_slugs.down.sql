-- Menghapus UNIQUE constraint dari tabel 'books'.
-- 'books_slug_unique' adalah nama constraint yang kita definisikan di atas.
ALTER TABLE books
DROP CONSTRAINT IF EXISTS books_slug_unique;

-- Menghapus UNIQUE constraint dari tabel 'authors'.
-- 'authors_slug_unique' adalah nama constraint yang kita definisikan di atas.
ALTER TABLE authors
DROP CONSTRAINT IF EXISTS authors_slug_unique;
