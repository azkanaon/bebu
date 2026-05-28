-- 1. Buat tabel report_summaries
CREATE TABLE report_summaries (
    report_summary_id BIGSERIAL PRIMARY KEY,
    entity_id INT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    total_reports INT NOT NULL DEFAULT 1,
    unique_reports INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'Not reviewed',
    first_report TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_report TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    review_by_admin_id INT,
    review_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign key ke tabel users untuk admin yang me-review
    CONSTRAINT fk_report_summaries_admin FOREIGN KEY (review_by_admin_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 2. Menambahkan partial index untuk mempermudah lookup "Summary yang Masih Aktif"
CREATE INDEX idx_report_summaries_active_lookup 
ON report_summaries (entity_type, entity_id) 
WHERE status = 'Not reviewed';


-- 3. Modifikasi tabel reports yang sudah ada
ALTER TABLE reports 
ADD COLUMN report_summary_id BIGINT;

-- Hubungkan ke tabel report_summaries sebagai Foreign Key
ALTER TABLE reports 
ADD CONSTRAINT fk_reports_summary_id FOREIGN KEY (report_summary_id) REFERENCES report_summaries(report_summary_id) ON DELETE CASCADE;

-- Tambahkan indeks pada foreign key baru untuk optimasi JOIN detail laporan
CREATE INDEX idx_reports_summary_id_fk ON reports(report_summary_id);


-- 4. Hapus kolom penanda review lama dari tabel reports (karena logic pindah ke summary)
-- Catatan: Jika ini production yang sudah live, lakukan backup data terlebih dahulu!
ALTER TABLE reports 
DROP COLUMN IF EXISTS review_by_admin_id,
DROP COLUMN IF EXISTS review_at,
DROP COLUMN IF EXISTS updated_at;