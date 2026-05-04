-- 1. Membuat tabel baru: 'notes'
-- Tabel ini akan menyimpan catatan yang dibuat pengguna pada bookshelf mereka.
CREATE TABLE notes (
    note_id         SERIAL PRIMARY KEY,
    user_bookshelf_id INT NOT NULL REFERENCES user_bookshelves(user_bookshelf_id) ON DELETE CASCADE,
    page_start      INT,
    page_end        INT,
    description     TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tambahkan index pada foreign key untuk performa query yang lebih cepat
CREATE INDEX idx_notes_on_user_bookshelf_id ON notes(user_bookshelf_id);


-- 2. Membuat tabel baru: 'user_stats'
-- Tabel ini digunakan untuk denormalisasi, menyimpan data agregat agar tidak perlu
-- dihitung berulang kali. Ini akan sangat meningkatkan performa.
CREATE TABLE user_stats (
    user_id          INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    total_followers  INT NOT NULL DEFAULT 0,
    total_following  INT NOT NULL DEFAULT 0,
    total_posts      INT NOT NULL DEFAULT 0,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reading_activity_logs
ADD COLUMN total_likes    INT NOT NULL DEFAULT 0,
ADD COLUMN total_comments INT NOT NULL DEFAULT 0,
ADD COLUMN total_posts    INT NOT NULL DEFAULT 0,
ADD COLUMN total_notes    INT NOT NULL DEFAULT 0;