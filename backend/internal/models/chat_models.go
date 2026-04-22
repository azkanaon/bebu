// chat_models.go
package models

import (
	"time"

	"gorm.io/gorm"
)

type Conversation struct {
	ConversationID   uint      `gorm:"column:conversation_id;primaryKey;autoIncrement"`
	PublicID         string    `gorm:"column:public_id;type:uuid;default:gen_random_uuid();unique;not null"`
	CreatedByUserID  uint      `gorm:"column:created_by_user_id;not null"`
	ConversationType string    `gorm:"column:conversation_type;size:50;not null;default:direct"`
	LastMessageAt    *time.Time `gorm:"column:last_message_at"`
	CreatedAt        time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt        time.Time `gorm:"column:updated_at;autoUpdateTime"`

	// Relations
	CreatedBy User                 `gorm:"foreignKey:CreatedByUserID;references:UserID"`
	Members   []ConversationMember `gorm:"foreignKey:ConversationID"`
	Messages  []Message            `gorm:"foreignKey:ConversationID"`
}

type Message struct {
	MessageID      uint           `gorm:"column:message_id;primaryKey;autoIncrement"`
	ConversationID uint           `gorm:"column:conversation_id;not null"`
	SenderUserID   uint           `gorm:"column:sender_user_id;not null"`
	PostID         *uint          `gorm:"column:post_id"`
	MessageType    string         `gorm:"column:message_type;size:50;not null;default:text"`
	Body           *string        `gorm:"column:body;type:text"`
	CreatedAt      time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt      time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt      gorm.DeletedAt `gorm:"column:deleted_at;index"`

	Conversation Conversation `gorm:"foreignKey:ConversationID;references:ConversationID"`
	Sender       User         `gorm:"foreignKey:SenderUserID;references:UserID"`
	Post         *Post        `gorm:"foreignKey:PostID;references:PostID"`
	Reads        []MessageRead `gorm:"foreignKey:MessageID"`
}

type ConversationMember struct {
	ConversationID    uint       `gorm:"column:conversation_id;primaryKey"`
	UserID            uint       `gorm:"column:user_id;primaryKey"`
	LastReadMessageID *uint      `gorm:"column:last_read_message_id"`
	Role              string     `gorm:"column:role;size:50;not null;default:member"`
	JoinedAt          time.Time  `gorm:"column:joined_at;autoCreateTime"`
	LeftAt            *time.Time `gorm:"column:left_at"`

	Conversation Conversation `gorm:"foreignKey:ConversationID;references:ConversationID"`
	User         User         `gorm:"foreignKey:UserID;references:UserID"`

	// 🔥 Tambahkan ini
	LastReadMessage *Message `gorm:"foreignKey:LastReadMessageID;references:MessageID;constraint:OnDelete:SET NULL"`
}

type MessageRead struct {
	MessageID uint      `gorm:"column:message_id;primaryKey"`
	UserID    uint      `gorm:"column:user_id;primaryKey"`
	ReadAt    time.Time `gorm:"column:read_at;autoCreateTime"`

	Message Message `gorm:"foreignKey:MessageID;references:MessageID"`
	User    User    `gorm:"foreignKey:UserID;references:UserID"`
}