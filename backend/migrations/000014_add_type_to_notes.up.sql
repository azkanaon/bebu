ALTER TABLE notes ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'insight';

-- 2. Tambahkan check constraint agar data konsisten di level database
ALTER TABLE notes 
ADD CONSTRAINT notes_type_check 
CHECK (type IN ('insight', 'quote', 'summary'));