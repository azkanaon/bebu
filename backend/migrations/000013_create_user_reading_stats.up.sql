CREATE TABLE user_reading_stats (
    user_id             INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    current_streak      INT NOT NULL DEFAULT 0,
    longest_streak      INT NOT NULL DEFAULT 0,
    last_activity_date  DATE, -- Kita pakai DATE agar jam tidak berpengaruh
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);