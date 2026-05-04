
-- Menambahkan UNIQUE constraint ke kolom 'slug' pada tabel 'authors'.
-- Ini memastikan tidak ada dua penulis yang bisa memiliki slug yang sama.
ALTER TABLE authors
ADD CONSTRAINT authors_slug_unique UNIQUE (slug);

-- Menambahkan UNIQUE constraint ke kolom 'slug' pada tabel 'books'.
-- Ini memastikan tidak ada dua buku yang bisa memiliki slug yang sama.
ALTER TABLE books
ADD CONSTRAINT books_slug_unique UNIQUE (slug);