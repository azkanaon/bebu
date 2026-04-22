// user_social_models.go
package models

import (
	"time"
)

type UserFollow struct {
	UserFollowedID  uint      `gorm:"column:user_followed_id;primaryKey"`
	UserFollowingID uint      `gorm:"column:user_following_id;primaryKey"`
	FollowingStatus string    `gorm:"column:following_status;size:20;not null;default:accepted"`
	CreatedAt       time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt       time.Time `gorm:"column:updated_at;autoUpdateTime"`

	// Relations
	FollowedUser  User `gorm:"foreignKey:UserFollowedID;references:UserID"`
	FollowingUser User `gorm:"foreignKey:UserFollowingID;references:UserID"`
}

type UserBlock struct {
	UserBlockedID  uint      `gorm:"column:user_blocked_id;primaryKey"`
	UserBlockingID uint      `gorm:"column:user_blocking_id;primaryKey"`
	CreatedAt      time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt      time.Time `gorm:"column:updated_at;autoUpdateTime"`

	// Relations
	BlockedUser  User `gorm:"foreignKey:UserBlockedID;references:UserID"`
	BlockingUser User `gorm:"foreignKey:UserBlockingID;references:UserID"`
}