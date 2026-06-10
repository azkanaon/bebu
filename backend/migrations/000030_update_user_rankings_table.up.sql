-- 1. Drop tabel user_rankings yang lama jika ada
DROP TABLE IF EXISTS user_rankings CASCADE;

-- 2. Buat ulang tabel user_rankings dengan struktur baru
CREATE TABLE user_rankings (
    user_id BIGINT NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- Isinya: 'all_time' atau 'monthly'
    period_key VARCHAR(20) NOT NULL,  -- Isinya: 'all' atau format '2026-06'
    total_exp INT NOT NULL DEFAULT 0,
    global_rank INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Composite Primary Key agar kombinasi ketiganya unik
    PRIMARY KEY (user_id, period_type, period_key),
    
    -- Foreign Key ke tabel users kamu (sesuai penamaan column di modelmu)
    CONSTRAINT fk_user_rankings_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE
);

-- 3. Tambahkan Index untuk mempercepat query berdasarkan peringkat dan periode
CREATE INDEX idx_user_rankings_period_rank 
ON user_rankings (period_type, period_key, global_rank);