// notification_models.go
package models

import "time"

type Notification struct {
	NotificationID   uint      `gorm:"primaryKey;column:notification_id"`
	UserReceiverID   uint      `gorm:"column:user_receiver_id;not null"`
	UserActedID      uint      `gorm:"column:user_acted_id"` // Actor terbaru
	NotificationType string    `gorm:"column:notification_type;size:100;not null"`
	EntityType       string    `gorm:"column:entity_type;size:100"`
	EntityID         uint      `gorm:"column:entity_id"`
	IsRead           bool      `gorm:"column:is_read;default:false"`
	ExtraActorsCount int       `gorm:"column:extra_actors_count;default:0"` // Kolom Baru
	CreatedAt        time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt        time.Time `gorm:"column:updated_at;autoUpdateTime"`   // Kolom Baru

	// Relations
	Receiver User `gorm:"foreignKey:UserReceiverID"`
	Actor    User `gorm:"foreignKey:UserActedID"`
}