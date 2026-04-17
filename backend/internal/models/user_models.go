package models

import (
	"time"
)

type User struct {
	ID        uint      `gorm:"primaryKey"`
	Email     string    `gorm:"uniqueIndex;not null"`
	Password  string    `gorm:"not null"`
	CreatedAt time.Time
	UpdatedAt time.Time

	Profile   UserProfile
	Settings  UserSettings
}

type UserProfile struct {
	ID        uint   `gorm:"primaryKey"`
	UserID    uint   `gorm:"uniqueIndex"`
	Username  string `gorm:"uniqueIndex"`
	Bio       string
	AvatarURL string
}

type UserSettings struct {
	ID     uint `gorm:"primaryKey"`
	UserID uint `gorm:"uniqueIndex"`
	IsPrivate bool
}

type UserSession struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    uint      `gorm:"index"`
	Token     string    `gorm:"uniqueIndex"`
	ExpiresAt time.Time
}

type PasswordReset struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    uint      `gorm:"index"`
	Token     string    `gorm:"uniqueIndex"`
	ExpiresAt time.Time
}