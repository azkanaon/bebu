// notification_models.go
package models

import "time"

type Notification struct {
	NotificationID   uint      `gorm:"column:notification_id;primaryKey;autoIncrement"`
	UserReceiverID   uint      `gorm:"column:user_receiver_id;not null;index:idx_notifications_receiver"`
	UserActedID      *uint     `gorm:"column:user_acted_id"`
	NotificationType string    `gorm:"column:notification_type;size:100;not null"`
	EntityType       *string   `gorm:"column:entity_type;size:100"`
	EntityID         *uint     `gorm:"column:entity_id"`
	IsRead           bool      `gorm:"column:is_read;not null;default:false;index:idx_notifications_unread"`
	CreatedAt        time.Time `gorm:"column:created_at;autoCreateTime"`

	// Relations
	UserReceiver User `gorm:"foreignKey:UserReceiverID;references:UserID"`
	UserActed    User `gorm:"foreignKey:UserActedID;references:UserID"`
}