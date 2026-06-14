ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS parent_message_id BIGINT REFERENCES messages(message_id) ON DELETE SET NULL;