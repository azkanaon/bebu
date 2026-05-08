-- MIGRATION UP

-- Menambahkan kolom 'display_order' ke user_badges
-- Nilai bisa 1, 2, 3, 4. NULL berarti tidak difavoritkan.
ALTER TABLE user_badges
ADD COLUMN display_order SMALLINT;

-- Menambahkan constraint untuk memastikan urutan unik per user
-- (satu user tidak bisa punya dua badge di slot 1)
CREATE UNIQUE INDEX idx_user_badges_unique_display_order
ON user_badges (user_id, display_order)
WHERE display_order IS NOT NULL;


-- Menambahkan kolom 'display_order' ke user_achievements
ALTER TABLE user_achievements
ADD COLUMN display_order SMALLINT;

-- Menambahkan constraint unik yang sama untuk achievements
CREATE UNIQUE INDEX idx_user_achievements_unique_display_order
ON user_achievements (user_id, display_order)
WHERE display_order IS NOT NULL;