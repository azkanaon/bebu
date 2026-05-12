ALTER TABLE post_comments
DROP CONSTRAINT IF EXISTS post_comments_parent_comment_id_fkey;

ALTER TABLE post_comments
ADD CONSTRAINT post_comments_parent_comment_id_fkey
FOREIGN KEY (parent_comment_id)
REFERENCES post_comments(post_comment_id)
ON DELETE CASCADE;