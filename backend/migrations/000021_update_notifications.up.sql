-- 1. Tambahkan kolom untuk menghitung orang lain (selain actor utama)
ALTER TABLE notifications 
ADD COLUMN extra_actors_count INT NOT NULL DEFAULT 0;

-- 2. Tambahkan updated_at agar saat ada orang baru yang like, 
-- notifikasi lama naik lagi ke urutan paling atas
ALTER TABLE notifications 
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. Tambahkan Index untuk mempercepat pencarian notifikasi yang akan di-update
-- Query kita nanti akan mencari: receiver_id + type + entity_id + is_read (false)
CREATE INDEX idx_notifications_aggregation_lookup 
ON notifications (user_receiver_id, notification_type, entity_id) 
WHERE is_read = FALSE;
