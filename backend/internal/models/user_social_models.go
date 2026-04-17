package models

import (
	"time"
)

type UserFollow struct {
	FollowerID uint `gorm:"primaryKey"`
	FollowingID uint `gorm:"primaryKey"`
	CreatedAt time.Time
}

type UserBlock struct {
	UserID    uint `gorm:"primaryKey"`
	BlockedID uint `gorm:"primaryKey"`
}