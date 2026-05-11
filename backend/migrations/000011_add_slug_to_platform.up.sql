ALTER TABLE platforms ADD COLUMN slug VARCHAR(100);

-- 2. Isi slug berdasarkan nama platform (lowercase dan ganti spasi jadi dash)
-- Contoh: 'Google Drive' jadi 'google-drive'
UPDATE platforms SET slug = LOWER(REPLACE(platform_name, ' ', '-'));

-- 3. Baru set NOT NULL dan UNIQUE setelah data terisi
ALTER TABLE platforms ALTER COLUMN slug SET NOT NULL;
ALTER TABLE platforms ADD CONSTRAINT platforms_slug_unique UNIQUE (slug);