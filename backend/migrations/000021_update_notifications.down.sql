DROP INDEX IF EXISTS idx_notifications_aggregation_lookup;
ALTER TABLE notifications DROP COLUMN IF EXISTS extra_actors_count;
ALTER TABLE notifications DROP COLUMN IF EXISTS updated_at;