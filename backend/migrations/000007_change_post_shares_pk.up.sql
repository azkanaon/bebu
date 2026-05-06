ALTER TABLE post_shares DROP CONSTRAINT IF EXISTS post_shares_pkey;

ALTER TABLE post_shares ADD COLUMN post_share_id SERIAL;

ALTER TABLE post_shares ADD PRIMARY KEY (post_share_id);