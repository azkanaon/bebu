package models

import (
	"time"
)

type Post struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    uint      `gorm:"index"`
	Content   string
	CreatedAt time.Time
	UpdatedAt time.Time

	Stats PostStat
}

type PostCategory struct {
	PostID     uint `gorm:"primaryKey"`
	CategoryID uint `gorm:"primaryKey"`
}

type PostStat struct {
	PostID    uint `gorm:"primaryKey"`
	LikeCount int
	CommentCount int
	ShareCount int
}