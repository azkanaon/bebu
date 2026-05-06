ALTER TABLE post_shares DROP CONSTRAINT IF EXISTS post_shares_pkey;

ALTER TABLE post_shares DROP COLUMN IF EXISTS post_share_id;

ALTER TABLE post_shares ADD PRIMARY KEY (post_id, user_sender_id, user_receiver_id);