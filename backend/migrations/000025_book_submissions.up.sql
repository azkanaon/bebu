CREATE TABLE book_submissions (
    book_submission_id BIGSERIAL PRIMARY KEY,
    submitted_by_user_id BIGINT NOT NULL,
    reviewed_by_user_id BIGINT NULL,
    book_id BIGINT NULL,
    title VARCHAR(255) NOT NULL,
    total_pages INTEGER NULL,
    language VARCHAR(100) NULL,
    isbn VARCHAR(20) NULL,
    synopsis TEXT NULL,
    cover_img_url TEXT NULL,
    user_note TEXT NULL,
    admin_note TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    reviewed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,

    CONSTRAINT fk_book_submissions_submitter
        FOREIGN KEY (submitted_by_user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_book_submissions_reviewer
        FOREIGN KEY (reviewed_by_user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_book_submissions_book
        FOREIGN KEY (book_id)
        REFERENCES books(book_id),

    CONSTRAINT chk_book_submission_status
        CHECK (
            status IN (
                'pending',
                'approved',
                'rejected',
                'duplicate',
                'needs_revision'
            )
        )
);

CREATE INDEX idx_book_submissions_submitter
    ON book_submissions(submitted_by_user_id);

CREATE INDEX idx_book_submissions_reviewer
    ON book_submissions(reviewed_by_user_id);

CREATE INDEX idx_book_submissions_book
    ON book_submissions(book_id);

CREATE INDEX idx_book_submissions_status
    ON book_submissions(status);

CREATE INDEX idx_book_submissions_created_at
    ON book_submissions(created_at);

CREATE INDEX idx_book_submissions_deleted_at
    ON book_submissions(deleted_at);



CREATE TABLE book_submission_authors (
    book_submission_author_id BIGSERIAL PRIMARY KEY,

    book_submission_id BIGINT NOT NULL,

    author_name VARCHAR(200) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_book_submission_authors_submission
        FOREIGN KEY (book_submission_id)
        REFERENCES book_submissions(book_submission_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_book_submission_authors_submission
    ON book_submission_authors(book_submission_id);