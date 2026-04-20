package models

import (
    "time"
    "github.com/google/uuid"
    "gorm.io/gorm"
)

type User struct {
    UserID         uint           `gorm:"primaryKey"`
    PublicID       uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();unique"`
    Email          string         `gorm:"type:varchar(255);unique;not null"`
    Username       string         `gorm:"type:varchar(100);unique;not null"`
    PasswordHash   string         `gorm:"type:text;not null"`
    Role           string         `gorm:"type:varchar(50);not null;default:'user'"`
    Status         string         `gorm:"type:varchar(10);not null;default:'active'"`
    IsActive       bool           `gorm:"not null;default:true"`
    EmailVerified  bool           `gorm:"not null;default:false"`
    LastLogin      *time.Time
    CreatedAt      time.Time
    UpdatedAt      time.Time
    DeletedAt      gorm.DeletedAt `gorm:"index"`
    Profile        UserProfile    `gorm:"foreignKey:UserID"`
    PasswordResets []PasswordReset `gorm:"foreignKey:UserID"`
}

type UserProfile struct {
    UserProfileID uint      `gorm:"primaryKey"`
    PublicID      uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();unique"`
    UserID        uint      `gorm:"not null"`
    DisplayName   string    `gorm:"type:varchar(150)"`
    Bio           string    `gorm:"type:text"`
	AvatarUrl     string    `gorm:"type:text"`
	Gender        string    `gorm:"type:varchar(20)"`
	Location      string    `gorm:"type:varchar(255)"`
    CreatedAt     time.Time
    UpdatedAt     time.Time
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
    PasswordResetID uint      `gorm:"primaryKey"`
    PublicID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();unique"`
    UserID          uint      `gorm:"not null"`
    TokenHash       string    `gorm:"type:text;not null"`
    ExpiresAt       time.Time `gorm:"not null"`
    UsedAt          *time.Time
    CreatedAt       time.Time
}

// RegisterRequest adalah struktur data yang diharapkan dari body request pendaftaran
type RegisterRequest struct {
	Username    string `json:"username" validate:"required,min=3,max=100"`
	Email       string `json:"email" validate:"required,email"`
	Password    string `json:"password" validate:"required,min=8"`
	DisplayName string `json:"display_name,omitempty"` // omitempty berarti opsional
}

// RegisterResponse adalah struktur data yang dikirim kembali setelah pendaftaran berhasil
type RegisterResponse struct {
	UserPublicID uuid.UUID `json:"user_public_id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	DisplayName  string    `json:"display_name"`
}