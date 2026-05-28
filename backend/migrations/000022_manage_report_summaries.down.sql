-- 1. Kembalikan kolom-kolom yang dihapus di tabel reports
ALTER TABLE reports 
ADD COLUMN review_by_admin_id INT,
ADD COLUMN review_at TIMESTAMPTZ,
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Tambahkan kembali foreign key review_by_admin_id ke tabel users yang lama jika ada
ALTER TABLE reports 
ADD CONSTRAINT fk_reports_admin_old FOREIGN KEY (review_by_admin_id) REFERENCES users(user_id) ON DELETE SET NULL;


-- 2. Hapus constraint dan kolom baru dari tabel reports
ALTER TABLE reports DROP CONSTRAINT IF EXISTS fk_reports_summary_id;
DROP INDEX IF EXISTS idx_reports_summary_id_fk;
ALTER TABLE reports DROP COLUMN IF EXISTS report_summary_id;


-- 3. Hapus tabel report_summaries beserta indeksnya
DROP INDEX IF EXISTS idx_report_summaries_active_lookup;
DROP TABLE IF EXISTS report_summaries;