ALTER TABLE search_logs DROP CONSTRAINT IF EXISTS user_query_unique;
ALTER TABLE search_logs DROP COLUMN IF EXISTS updated_at;