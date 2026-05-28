DROP INDEX IF EXISTS idx_admin_actions_report_summary_id;

ALTER TABLE admin_actions
DROP CONSTRAINT IF EXISTS fk_admin_actions_report_summary;

ALTER TABLE admin_actions
DROP COLUMN IF EXISTS report_summary_id;