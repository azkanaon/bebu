package models

import (
	"time"

	"gorm.io/gorm"
)

type Platform struct {
	ID   uint   `gorm:"primaryKey"`
	Name string `gorm:"uniqueIndex"`
}

type UserSocialLink struct {
	ID         uint   `gorm:"primaryKey"`
	UserID     uint   `gorm:"index"`
	PlatformID uint   `gorm:"index"`
	URL        string
}

type UserCategory struct {
	UserID     uint           `gorm:"column:user_id;primaryKey"`
	CategoryID uint           `gorm:"column:category_id;primaryKey"`

	CreatedAt  time.Time      `gorm:"column:created_at"`
	DeletedAt  gorm.DeletedAt `gorm:"column:deleted_at;index"`

	// Relations
	User     *User     `gorm:"foreignKey:UserID;references:UserID"`
	Category *Category `gorm:"foreignKey:CategoryID;references:CategoryID"`
}