
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- provides gen_random_uuid()

CREATE TABLE users (
    user_id       SERIAL       PRIMARY KEY,
    public_id     UUID         NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    role          VARCHAR(50)  NOT NULL DEFAULT 'user',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    email_verified BOOLEAN     NOT NULL DEFAULT FALSE,
    last_login    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE TABLE user_profiles (
    user_profile_id SERIAL      PRIMARY KEY,
    public_id       UUID        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    user_id         INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    display_name    VARCHAR(150),
    gender          VARCHAR(20),
    bio             VARCHAR(150),
    location        VARCHAR(150),
    avatar_url      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_settings (
    user_setting_id       SERIAL      PRIMARY KEY,
    public_id             UUID        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    user_id               INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    is_profile_public     BOOLEAN     NOT NULL DEFAULT TRUE,
    show_activity_heatmap BOOLEAN     NOT NULL DEFAULT TRUE,
    allow_dm_from_public  BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE platforms (
    platform_id        SERIAL      PRIMARY KEY,
    public_id          UUID        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    platform_name      VARCHAR(100) NOT NULL,
    platform_image_url TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_social_links (
    user_social_link_id SERIAL      PRIMARY KEY,
    public_id           UUID        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    user_id             INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    platform_id         INT         NOT NULL REFERENCES platforms(platform_id),
    social_url          VARCHAR(255) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_follows (
    user_followed_id  INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user_following_id INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    following_status  VARCHAR(20) NOT NULL DEFAULT 'accepted',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_followed_id, user_following_id)
);

CREATE TABLE user_blocks (
    user_blocked_id  INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user_blocking_id INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_blocked_id, user_blocking_id)
);

CREATE TABLE user_sessions (
    user_session_id    SERIAL      PRIMARY KEY,
    public_id          UUID        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    user_id            INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    refresh_token_hash TEXT        NOT NULL,
    device_info        TEXT,
    ip_address         INET,
    expires_at         TIMESTAMPTZ NOT NULL,
    revoked_at         TIMESTAMPTZ
);

CREATE TABLE password_resets (
    password_reset_id SERIAL      PRIMARY KEY,
    public_id         UUID        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    user_id           INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash        TEXT        NOT NULL,
    expires_at        TIMESTAMPTZ NOT NULL,
    used_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE level_master (
    level_master_id SERIAL      PRIMARY KEY,
    level_number    INT         NOT NULL UNIQUE,
    min_total_exp   INT         NOT NULL,
    max_total_exp   INT         NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_level (
    user_id           INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    level_master_id   INT         NOT NULL REFERENCES level_master(level_master_id),
    total_exp         INT         NOT NULL DEFAULT 0,
    current_level_exp INT         NOT NULL DEFAULT 0,
    next_level_exp    INT         NOT NULL DEFAULT 0,
    last_level_up_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

CREATE TABLE exp_transactions (
    exp_transaction_id SERIAL      PRIMARY KEY,
    user_id            INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    source_id          INT,
    source_type        VARCHAR(50) NOT NULL,
    exp_amount         INT         NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE badges (
    badge_id    SERIAL      PRIMARY KEY,
    badge_name  VARCHAR(150) NOT NULL,
    description TEXT,
    logo_url    TEXT,
    badge_tier  VARCHAR(20),
    total_exp   INT         NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE achievements (
    achievement_id   SERIAL      PRIMARY KEY,
    badge_id         INT         REFERENCES badges(badge_id),
    achievement_name VARCHAR(150) NOT NULL,
    description      TEXT,
    logo_url         TEXT,
    criteria_value   INT, 
    total_exp        INT         NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_badges (
    user_id          INT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    badge_id         INT          NOT NULL REFERENCES badges(badge_id),
    earned_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    progress_percent INT          NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE user_achievements (
    user_id          INT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    achievement_id   INT          NOT NULL REFERENCES achievements(achievement_id),
    earned_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    progress_percent INT          NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE user_ranking (
    user_id     INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    global_rank INT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

CREATE TABLE genres (
    genre_id   SERIAL      PRIMARY KEY,
    genre_name VARCHAR(30) NOT NULL,
    slug       VARCHAR(30) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE categories (
    category_id         SERIAL      PRIMARY KEY,
    category_name       VARCHAR(100) NOT NULL,
    category_normalized VARCHAR(100) NOT NULL,
    usage_count         INT         NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_categories (
    user_id       INT         NOT NULL REFERENCES users(user_id)      ON DELETE CASCADE,
    categories_id INT         NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ,
    PRIMARY KEY (user_id, categories_id)
);

CREATE TABLE authors (
    author_id   SERIAL      PRIMARY KEY,
    public_id   UUID        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    author_name VARCHAR(200) NOT NULL,
    slug        VARCHAR(220) NOT NULL UNIQUE,
    bio         TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE TABLE books (
    book_id          SERIAL      PRIMARY KEY,
    public_id        UUID        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    title            VARCHAR(255) NOT NULL,
    synopsis         TEXT,
    cover_img_url    TEXT,
    publication_year SMALLINT,
    language         VARCHAR(50),
    total_pages      INT,
    slug             VARCHAR(255),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

CREATE TABLE books_authors (
    book_id    INT         NOT NULL REFERENCES books(book_id)   ON DELETE CASCADE,
    author_id  INT         NOT NULL REFERENCES authors(author_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (book_id, author_id)
);

CREATE TABLE books_genres (
    book_id    INT         NOT NULL REFERENCES books(book_id)  ON DELETE CASCADE,
    genre_id   INT         NOT NULL REFERENCES genres(genre_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (book_id, genre_id)
);

CREATE TABLE book_submissions (
    book_submission_id SERIAL      PRIMARY KEY,
    user_id            INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    cover_img_url      TEXT,
    title              VARCHAR(255) NOT NULL,
    status             VARCHAR(50) NOT NULL DEFAULT 'pending',
    language           VARCHAR(50),
    total_pages        INT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE book_submission_authors (
    book_submission_id INT         NOT NULL REFERENCES book_submissions(book_submission_id) ON DELETE CASCADE,
    author_id          INT         NOT NULL REFERENCES authors(author_id) ON DELETE CASCADE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (book_submission_id, author_id)
);

CREATE TABLE posts (
    post_id        SERIAL      PRIMARY KEY,
    public_id      UUID        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    user_id        INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    book_id        INT         REFERENCES books(book_id),
    description    TEXT,
    post_type      VARCHAR(50) NOT NULL,
    rating         NUMERIC(3,1),
    img_url        TEXT,
    publish_status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at   TIMESTAMPTZ,
    deleted_at     TIMESTAMPTZ
);

CREATE TABLE post_categories (
    post_id     INT         NOT NULL REFERENCES posts(post_id)      ON DELETE CASCADE,
    category_id INT         NOT NULL REFERENCES categories(category_id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, category_id)
);

CREATE TABLE post_stats (
    post_stat_id      SERIAL       PRIMARY KEY,
    post_id           INT          NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    like_count        INT          NOT NULL DEFAULT 0,
    comment_count     INT          NOT NULL DEFAULT 0,
    save_count        INT          NOT NULL DEFAULT 0,
    hot_score         NUMERIC(10,4) NOT NULL DEFAULT 0,  -- buat sistem rekomendasi
    last_commented_at TIMESTAMPTZ,
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE post_likes (
    post_id    INT         NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    user_id    INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE post_saves (
    post_id    INT         NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    user_id    INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE post_shares (
    post_id          INT         NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    user_sender_id   INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user_receiver_id INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ,
    PRIMARY KEY (post_id, user_sender_id, user_receiver_id)
);

CREATE TABLE post_comments (
    post_comment_id   SERIAL      PRIMARY KEY,
    post_id           INT         NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    user_id           INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    comment           TEXT        NOT NULL,
    parent_comment_id INT         REFERENCES post_comments(post_comment_id),
    like_count        INT         NOT NULL DEFAULT 0,
    reply_count       INT         NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ
);

CREATE TABLE post_comment_likes (
    post_comment_id INT         NOT NULL REFERENCES post_comments(post_comment_id) ON DELETE CASCADE,
    user_id         INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_comment_id, user_id)
);

CREATE TABLE user_bookshelves (
    user_bookshelf_id SERIAL       PRIMARY KEY,
    public_id         UUID         NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    user_id           INT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    book_id           INT          NOT NULL REFERENCES books(book_id),
    shelf_status      VARCHAR(50)  NOT NULL DEFAULT 'want_to_read',
    progress_percent  INT,
    started_at        TIMESTAMPTZ,
    finished_at       TIMESTAMPTZ,
    notes             TEXT,
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE reading_wraps (
    reading_wrap_id       SERIAL      PRIMARY KEY,
    public_id             UUID        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    user_id               INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    top_author_id         INT         REFERENCES authors(author_id),
    top_genre_id          INT         REFERENCES genres(genre_id),
    top_book_id           INT         REFERENCES books(book_id),
    year                  SMALLINT    NOT NULL,
    total_pages_read      INT         NOT NULL DEFAULT 0,
    total_books_read      INT         NOT NULL DEFAULT 0,
    total_likes_received  INT         NOT NULL DEFAULT 0,
    total_reviews_read    INT         NOT NULL DEFAULT 0,
    total_comments_written INT        NOT NULL DEFAULT 0,
    generated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reading_activity_logs (
    reading_activity_log_id SERIAL      PRIMARY KEY,
    user_id                 INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    total_value             INT         NOT NULL DEFAULT 0,  -- untuk nentuin warna heatmap (misal: jumlah halaman yang dibaca hari itu)
    date                    DATE        NOT NULL,
    UNIQUE (user_id, date)
);

CREATE TABLE conversations (
    conversation_id    SERIAL      PRIMARY KEY,
    public_id          UUID        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    created_by_user_id INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    conversation_type  VARCHAR(50) NOT NULL DEFAULT 'direct',
    last_message_at    TIMESTAMPTZ,  -- untuk menyimpan waktu pesan terakhir dikirim, berguna untuk mengurutkan percakapan di UI
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE conversation_members (
    conversation_id      INT         NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    user_id              INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    last_read_message_id INT,
    role                 VARCHAR(50) NOT NULL DEFAULT 'member',
    joined_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at              TIMESTAMPTZ,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
    message_id      SERIAL      PRIMARY KEY,
    conversation_id INT         NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    sender_user_id  INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    post_id         INT         REFERENCES posts(post_id),
    message_type    VARCHAR(50) NOT NULL DEFAULT 'text',
    body            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE TABLE message_reads (
    message_id INT         NOT NULL REFERENCES messages(message_id) ON DELETE CASCADE,
    user_id    INT         NOT NULL REFERENCES users(user_id)       ON DELETE CASCADE,
    read_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id)
);

CREATE TABLE notifications (
    notification_id   SERIAL      PRIMARY KEY,
    user_receiver_id  INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user_acted_id     INT         REFERENCES users(user_id),
    notification_type VARCHAR(100) NOT NULL,
    entity_type       VARCHAR(100),
    entity_id         INT,
    is_read           BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE search_logs (
    search_log_id    SERIAL      PRIMARY KEY,
    user_id          INT         REFERENCES users(user_id) ON DELETE SET NULL,
    query_text       TEXT        NOT NULL,
    query_normalized TEXT        NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reports (
    report_id          SERIAL      PRIMARY KEY,
    user_id            INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    entity_id          INT         NOT NULL,
    entity_type        VARCHAR(100) NOT NULL,
    review_by_admin_id INT         REFERENCES users(user_id),
    reason_text        TEXT,
    review_at         TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_actions (
    admin_action_id SERIAL      PRIMARY KEY,
    admin_id        INT         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    action_type     VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(100),
    entity_id       INT,
    reason          TEXT,
    duration_days   INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_public_id             ON users(public_id);
CREATE INDEX idx_posts_public_id             ON posts(public_id);
CREATE INDEX idx_books_public_id             ON books(public_id);
CREATE INDEX idx_authors_public_id           ON authors(public_id);
CREATE INDEX idx_conversations_public_id     ON conversations(public_id);
CREATE INDEX idx_user_bookshelves_public_id  ON user_bookshelves(public_id);


CREATE INDEX idx_users_deleted_at            ON users(deleted_at)           WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_user_id               ON posts(user_id);
CREATE INDEX idx_posts_book_id               ON posts(book_id);
CREATE INDEX idx_posts_publish_status        ON posts(publish_status);
CREATE INDEX idx_posts_deleted_at            ON posts(deleted_at)           WHERE deleted_at IS NULL;
CREATE INDEX idx_post_comments_post_id       ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id       ON post_comments(user_id);
CREATE INDEX idx_bookshelves_user_id         ON user_bookshelves(user_id);
CREATE INDEX idx_bookshelves_book_id         ON user_bookshelves(book_id);
CREATE INDEX idx_messages_conversation       ON messages(conversation_id);
CREATE INDEX idx_messages_sender             ON messages(sender_user_id);
CREATE INDEX idx_notifications_receiver      ON notifications(user_receiver_id);
CREATE INDEX idx_notifications_unread        ON notifications(user_receiver_id) WHERE is_read = FALSE;
CREATE INDEX idx_search_logs_normalized      ON search_logs(query_normalized);
CREATE INDEX idx_reading_activity_user_date  ON reading_activity_logs(user_id, date);
CREATE INDEX idx_user_categories_active      ON user_categories(user_id)        WHERE deleted_at IS NULL;