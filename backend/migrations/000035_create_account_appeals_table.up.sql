CREATE TABLE account_appeals (
    account_appeal_id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    admin_action_id INT DEFAULT NULL,
    appeal_reason TEXT NOT NULL,
    evidence_url TEXT DEFAULT NULL, -- 💡 Tambahan kolom baru untuk menyimpan URL bukti gambar dari Cloudinary
    status VARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    admin_notes TEXT DEFAULT NULL,
    reviewed_by_admin_id INT DEFAULT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints & Foreign Keys
    CONSTRAINT fk_appeals_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_appeals_admin_action FOREIGN KEY (admin_action_id) REFERENCES admin_actions(admin_action_id) ON DELETE SET NULL,
    CONSTRAINT fk_appeals_reviewer FOREIGN KEY (reviewed_by_admin_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT chk_appeal_status CHECK (status IN ('Pending', 'Approved', 'Rejected'))
);

-- Indexing untuk optimasi query admin dashboard
CREATE INDEX idx_account_appeals_status ON account_appeals(status);
CREATE INDEX idx_account_appeals_user_id ON account_appeals(user_id);