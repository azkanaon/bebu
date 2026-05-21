// post_models.go
package models

import (
	"time"

	"gorm.io/gorm"
)

type Post struct {
	PostID        uint           `gorm:"column:post_id;primaryKey;autoIncrement"`
	PublicID      string         `gorm:"column:public_id"`
	UserID        uint           `gorm:"column:user_id"`
	BookID        uint           `gorm:"column:book_id"`
	Description   string         `gorm:"column:description"`
	PostType      string         `gorm:"column:post_type"`
	Rating        float64        `gorm:"column:rating"`
	ImgURL        string         `gorm:"column:img_url"`
	PublishStatus string         `gorm:"column:publish_status"`
	CreatedAt     time.Time      `gorm:"column:created_at"`
	UpdatedAt     time.Time      `gorm:"column:updated_at"`
	PublishedAt   time.Time      `gorm:"column:published_at"`
	DeletedAt     gorm.DeletedAt `gorm:"column:deleted_at"`

	// Relations
	User       *User         `gorm:"foreignKey:UserID;references:UserID"`
	Book       *Book         `gorm:"foreignKey:BookID;references:BookID"`
	Stats      *PostStat     `gorm:"foreignKey:PostID;references:PostID"`
	Categories []Category    `gorm:"many2many:post_categories;joinForeignKey:PostID;joinReferences:CategoryID"`
	Comments   []PostComment `gorm:"foreignKey:PostID"`
	Likes      []PostLike    `gorm:"foreignKey:PostID"`
	Saves      []PostSave    `gorm:"foreignKey:PostID"`
	Shares     []PostShare   `gorm:"foreignKey:PostID"`

	// Virtual Column
	TotalLikes int  `gorm:"-" json:"likes"`
	IsLiked    bool `gorm:"->;column:is_liked" json:"is_liked"`
	IsSaved    bool `gorm:"->;column:is_saved" json:"is_saved"`
}

type PostCategory struct {
	PostID     uint      `gorm:"column:post_id;primaryKey"`
	CategoryID uint      `gorm:"column:category_id;primaryKey"`
	CreatedAt  time.Time `gorm:"column:created_at;autoCreateTime"`

	Post     Post     `gorm:"foreignKey:PostID"`
	Category Category `gorm:"foreignKey:CategoryID"`
}

type PostStat struct {
	PostStatID      uint       `gorm:"column:post_stat_id;primaryKey"`
	PostID          uint       `gorm:"column:post_id"`
	LikeCount       int        `gorm:"column:like_count"`
	CommentCount    int        `gorm:"column:comment_count"`
	SaveCount       int        `gorm:"column:save_count"`
	ShareCount      int        `gorm:"column:share_count"`
	HotScore        float64    `gorm:"column:hot_score;default:0.0"`
	LastCommentedAt *time.Time `gorm:"column:last_commented_at"`
	UpdatedAt       time.Time  `gorm:"column:updated_at"`

	Post *Post `gorm:"foreignKey:PostID"`
}
