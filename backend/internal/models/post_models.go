// post_models.go
package models

import (
	"time"

	"gorm.io/gorm"
)

// =====================
// Post Model
// =====================
type Post struct {
	PostID        uint           `gorm:"column:post_id;primaryKey;autoIncrement"`
	PublicID      string         `gorm:"column:public_id"`
	UserID        uint           `gorm:"column:user_id"`
	BookID        uint          `gorm:"column:book_id"`
	Description   string        `gorm:"column:description"`
	PostType      string         `gorm:"column:post_type"`
	Rating        float64       `gorm:"column:rating"`
	ImgURL        string        `gorm:"column:img_url"`
	PublishStatus string         `gorm:"column:publish_status"`
	CreatedAt     time.Time      `gorm:"column:created_at"`
	UpdatedAt     time.Time      `gorm:"column:updated_at"`
	PublishedAt   time.Time     `gorm:"column:published_at"`
	DeletedAt     gorm.DeletedAt `gorm:"column:deleted_at"`

	// Relations
	User       *User          `gorm:"foreignKey:UserID"`
	Book       *Book          `gorm:"foreignKey:BookID"`
	Stat       *PostStat      `gorm:"foreignKey:PostID"`
	Categories []Category     `gorm:"many2many:post_categories"`
	Comments   []PostComment  `gorm:"foreignKey:PostID"`
	Likes      []PostLike     `gorm:"foreignKey:PostID"`
	Saves      []PostSave     `gorm:"foreignKey:PostID"`
	Shares     []PostShare    `gorm:"foreignKey:PostID"`
}

// =====================
// PostCategory Model
// =====================
type PostCategory struct {
	PostID      uint      `gorm:"column:post_id;primaryKey"`
	CategoryID  uint      `gorm:"column:category_id;primaryKey"`
	CreatedAt   time.Time `gorm:"column:created_at;autoCreateTime"`

	Post     Post     `gorm:"foreignKey:PostID;references:PostID"`
	Category Category `gorm:"foreignKey:CategoryID;references:CategoryID"`
}

type PostStat struct {
	PostStatID      uint       `gorm:"column:post_stat_id;primaryKey"`
	PostID          uint       `gorm:"column:post_id"`
	LikeCount       int        `gorm:"column:like_count"`
	CommentCount    int        `gorm:"column:comment_count"`
	SaveCount       int        `gorm:"column:save_count"`
	HotScore        float64    `gorm:"column:hot_score"`
	LastCommentedAt *time.Time `gorm:"column:last_commented_at"`
	UpdatedAt       time.Time  `gorm:"column:updated_at"`

	Post *Post `gorm:"foreignKey:PostID"`
}