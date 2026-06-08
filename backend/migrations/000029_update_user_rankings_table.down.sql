-- 1. Drop tabel baru
DROP TABLE IF EXISTS user_rankings CASCADE;

-- 2. Kembalikan ke struktur lama (sesuai model awal kamu)
CREATE TABLE user_rankings (
    user_id BIGINT NOT NULL,
    global_rank INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id),
    CONSTRAINT fk_user_rankings_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE
);