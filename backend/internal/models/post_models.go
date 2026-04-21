package models

import (
	"time"

	"gorm.io/gorm"
)

// =====================
// Post Model
// =====================
type Post struct {
	PostID        uint           `gorm:"primaryKey;column:post_id"`
	UserID        uint           `gorm:"column:user_id;not null"`
	BookID        uint           `gorm:"column:book_id"`
	Description   string         `gorm:"type:text"`
	ImgURL        string         `gorm:"column:img_url"`
	PostType      string         `gorm:"column:post_type"`
	Rating        *float64       `gorm:"column:rating"`
	PublishStatus string         `gorm:"column:publish_status"`

	CreatedAt     time.Time      `gorm:"column:created_at"`
	UpdatedAt     time.Time      `gorm:"column:updated_at"`
	PublishedAt   *time.Time     `gorm:"column:published_at"`
	DeletedAt     gorm.DeletedAt `gorm:"column:deleted_at;index"`

	// Relations
	PostCategories []*PostCategory `gorm:"foreignKey:PostID"`
	PostStats      *PostStats      `gorm:"foreignKey:PostID"`
}

// =====================
// PostCategory Model
// =====================
type PostCategory struct {
	PostID       uint      `gorm:"column:post_id;primaryKey"`
	CategoryID uint      `gorm:"column:category_id;primaryKey"`
	CreatedAt    time.Time `gorm:"column:created_at"`

	// Relation
	Post *Post `gorm:"foreignKey:PostID;references:PostID"`
	Category *Category `gorm:"foreignKey:CategoryID;references:CategoryID"`
}

// =====================
// PostStats Model
// =====================
type PostStats struct {
	PostStatID       uint       `gorm:"primaryKey;column:post_stat_id"`
	PostID           uint       `gorm:"column:post_id;uniqueIndex"`

	LikeCount        int        `gorm:"column:like_count"`
	CommentCount     int        `gorm:"column:comment_count"`
	SaveCount        int        `gorm:"column:save_count"`
	HotScore         float64    `gorm:"column:hot_score"`
	LastCommentedAt  *time.Time `gorm:"column:last_commented_at"`

	UpdatedAt        time.Time  `gorm:"column:updated_at"`

	// Relation
	Post *Post `gorm:"foreignKey:PostID;references:PostID"`
}