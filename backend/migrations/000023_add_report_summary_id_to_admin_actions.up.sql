ALTER TABLE admin_actions
ADD COLUMN report_summary_id BIGINT;

ALTER TABLE admin_actions
ADD CONSTRAINT fk_admin_actions_report_summary
FOREIGN KEY (report_summary_id)
REFERENCES report_summaries(report_summary_id)
ON DELETE SET NULL;

CREATE INDEX idx_admin_actions_report_summary_id
ON admin_actions(report_summary_id);