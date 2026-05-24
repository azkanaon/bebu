package repositories

import (
	"backend-bebu/internal/models"
	"time"

	"gorm.io/gorm"
)

type NotificationRepository interface {
	CreateOrUpdate(notif *models.Notification) error
	GetNotifications(userID uint, page, limit int) ([]models.Notification, int64, error)
	RemoveOrDecrement(notif *models.Notification, actorID uint, amount int) error
	MarkAsRead(userID uint, notifID uint) error
	MarkAllAsRead(userID uint) error
	GetLatest(receiverID uint, notifType string, entityID uint) (*models.Notification, error)
	CountUnread(userID uint) (int64, error)
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

var aggregatedTableRegistry = map[string]struct {
	TableName string
	IDColumn  string
}{
	"POST_LIKE": {TableName: "post_likes", IDColumn: "post_id"},
	"POST_SAVE": {TableName: "post_saves", IDColumn: "post_id"},
	"POST_COMMENT": {TableName: "post_comments", IDColumn: "post_id"},
	"COMMENT_LIKE": {TableName: "post_comment_likes", IDColumn: "post_comment_id"},
	"COMMENT_REPLY": {TableName: "post_comments", IDColumn: "parent_comment_id"},
}

func (r *notificationRepository) CreateOrUpdate(notif *models.Notification) error {
	var existing models.Notification

	// 1. Cari apakah ada notifikasi serupa yang BELUM dibaca
	// Kriteria serupa: Receiver sama, Tipe sama, dan EntityID sama
	err := r.db.Where("user_receiver_id = ? AND notification_type = ? AND entity_id = ? AND is_read = ?",
		notif.UserReceiverID, notif.NotificationType, notif.EntityID, false).
		First(&existing).Error

	if err == nil {
		// 2. JIKA KETEMU: Lakukan Agregasi (Update)
		// Update ActorID menjadi orang terbaru yang melakukan aksi
		// Tambah ExtraActorsCount
		return r.db.Model(&existing).Updates(map[string]interface{}{
			"user_acted_id":       notif.UserActedID,
			"extra_actors_count":  gorm.Expr("extra_actors_count + 1"),
			"updated_at":          notif.UpdatedAt,
		}).Error
	}

	// 3. JIKA TIDAK KETEMU: Buat baru (Insert)
	return r.db.Create(notif).Error
}

func (r *notificationRepository) GetNotifications(userID uint, page, limit int) ([]models.Notification, int64, error) {
	var notifications []models.Notification
	var total int64
	offset := (page - 1) * limit

	query := r.db.Model(&models.Notification{}).Where("user_receiver_id = ?", userID)

	query.Count(&total)

	err := query.Preload("Actor.Profile"). // Ambil info orang yang melakukan aksi
		Order("updated_at DESC").
		Limit(limit).Offset(offset).
		Find(&notifications).Error

	return notifications, total, err
}

func (r *notificationRepository) RemoveOrDecrement(notif *models.Notification, actorID uint, amount int) error {
	var existing models.Notification

	err := r.db.Where("user_receiver_id = ? AND notification_type = ? AND entity_id = ? AND is_read = ?",
		notif.UserReceiverID, notif.NotificationType, notif.EntityID, false).
		First(&existing).Error

	if err != nil {
		return nil 
	}

	// JIKA jumlah yang dihapus melebihi atau sama dengan extra_count, 
    // artinya semua interaksi di notif ini sudah hilang. Hapus barisnya.
	if int(existing.ExtraActorsCount) < amount {
		return r.db.Delete(&existing).Error
	}

	// JIKA masih ada sisa, kurangi jumlahnya sebanyak 'amount'
	updates := map[string]interface{}{
		"extra_actors_count": gorm.Expr("extra_actors_count - ?", amount),
		"updated_at":         time.Now(),
	}

	// Cari pengganti UserActedID jika yang menghapus adalah si Aktor Utama
	if existing.UserActedID == actorID {
		if registry, exists := aggregatedTableRegistry[existing.NotificationType]; exists {
			var newActorID uint
			query := r.db.Table(registry.TableName).
				Select("user_id").
				Where(registry.IDColumn+" = ?", existing.EntityID)

			// --- PERBAIKAN KRUSIAL DI SINI ---
			// Jika tabel tersebut mendukung Soft Delete (seperti post_comments),
			// kita harus membuang data yang sudah dihapus dari pencarian.
			if registry.TableName == "post_comments" || registry.TableName == "posts" {
				query = query.Where("deleted_at IS NULL")
			}
			// ---------------------------------

			err := query.Order("created_at DESC").
				Limit(1).
				Scan(&newActorID).Error

			if err == nil && newActorID > 0 {
				updates["user_acted_id"] = newActorID
			}
		}
	}

	return r.db.Model(&existing).Updates(updates).Error
}

func (r *notificationRepository) MarkAsRead(userID uint, notifID uint) error {
	// Update is_read jadi true HANYA jika notifikasi tersebut milik si userID
	result := r.db.Model(&models.Notification{}).
		Where("notification_id = ? AND user_receiver_id = ?", notifID, userID).
		Update("is_read", true)

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *notificationRepository) MarkAllAsRead(userID uint) error {
	// Update semua yang is_read-nya masih false milik user ini
	return r.db.Model(&models.Notification{}).
		Where("user_receiver_id = ? AND is_read = ?", userID, false).
		Update("is_read", true).Error
}

func (r *notificationRepository) GetLatest(receiverID uint, notifType string, entityID uint) (*models.Notification, error) {
	var notif models.Notification
	
	err := r.db.Preload("Actor.Profile").
		Where("user_receiver_id = ? AND notification_type = ? AND entity_id = ? AND is_read = ?", 
			receiverID, notifType, entityID, false).
		First(&notif).Error
		
	if err != nil {
		return nil, err
	}
	return &notif, nil
}

func (r *notificationRepository) CountUnread(userID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.Notification{}).
		Where("user_receiver_id = ? AND is_read = ?", userID, false).
		Count(&count).Error
	return count, err
}