package models

import (
	"time"
)

type Conversation struct {
	ID        uint      `gorm:"primaryKey"`
	CreatedAt time.Time
}

type ConversationMember struct {
	ConversationID uint `gorm:"primaryKey"`
	UserID         uint `gorm:"primaryKey"`
	JoinedAt       time.Time
}

type Message struct {
	ID             uint      `gorm:"primaryKey"`
	ConversationID uint      `gorm:"index"`
	SenderID       uint      `gorm:"index"`
	Content        string
	CreatedAt      time.Time
}

type MessageRead struct {
	MessageID uint `gorm:"primaryKey"`
	UserID    uint `gorm:"primaryKey"`
	ReadAt    time.Time
}