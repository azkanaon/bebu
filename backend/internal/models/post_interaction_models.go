package models

import (
	"time"
)

type PostLike struct {
	UserID uint `gorm:"primaryKey"`
	PostID uint `gorm:"primaryKey"`
	CreatedAt time.Time
}

type PostSave struct {
	UserID uint `gorm:"primaryKey"`
	PostID uint `gorm:"primaryKey"`
	CreatedAt time.Time
}

type PostShare struct {
	UserID uint `gorm:"primaryKey"`
	PostID uint `gorm:"primaryKey"`
	CreatedAt time.Time
}

type PostComment struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    uint      `gorm:"index"`
	PostID    uint      `gorm:"index"`
	Content   string
	CreatedAt time.Time
}

type PostCommentLike struct {
	UserID    uint `gorm:"primaryKey"`
	CommentID uint `gorm:"primaryKey"`
}