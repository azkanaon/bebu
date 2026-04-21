// post_interaction_models.go
package models

import (
	"time"

	"gorm.io/gorm"
)

type PostLike struct {
	PostID    uint      `gorm:"column:post_id;primaryKey"`
	UserID    uint      `gorm:"column:user_id;primaryKey"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime"`

	Post Post `gorm:"foreignKey:PostID;references:PostID"`
	User User `gorm:"foreignKey:UserID;references:UserID"`
}

type PostSave struct {
	PostID    uint      `gorm:"column:post_id;primaryKey"`
	UserID    uint      `gorm:"column:user_id;primaryKey"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime"`

	Post Post `gorm:"foreignKey:PostID;references:PostID"`
	User User `gorm:"foreignKey:UserID;references:UserID"`
}

type PostShare struct {
	PostID          uint           `gorm:"column:post_id;primaryKey"`
	UserSenderID    uint           `gorm:"column:user_sender_id;primaryKey"`
	UserReceiverID  uint           `gorm:"column:user_receiver_id;primaryKey"`
	CreatedAt       time.Time      `gorm:"column:created_at;autoCreateTime"`
	DeletedAt       gorm.DeletedAt `gorm:"column:deleted_at;index"`

	Post         Post `gorm:"foreignKey:PostID;references:PostID"`
	UserSender   User `gorm:"foreignKey:UserSenderID;references:UserID"`
	UserReceiver User `gorm:"foreignKey:UserReceiverID;references:UserID"`
}

type PostComment struct {
	PostCommentID    uint           `gorm:"column:post_comment_id;primaryKey;autoIncrement"`
	PostID           uint           `gorm:"column:post_id;not null;index:idx_post_comments_post_id"`
	UserID           uint           `gorm:"column:user_id;not null;index:idx_post_comments_user_id"`
	Comment          string         `gorm:"column:comment;type:text;not null"`
	ParentCommentID  *uint          `gorm:"column:parent_comment_id"`
	LikeCount        int            `gorm:"column:like_count;not null;default:0"`
	ReplyCount       int            `gorm:"column:reply_count;not null;default:0"`
	CreatedAt        time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt        time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt        gorm.DeletedAt `gorm:"column:deleted_at;index"`

	Post          Post          `gorm:"foreignKey:PostID;references:PostID"`
	User          User          `gorm:"foreignKey:UserID;references:UserID"`
	ParentComment *PostComment  `gorm:"foreignKey:ParentCommentID;references:PostCommentID"`
	Replies       []PostComment `gorm:"foreignKey:ParentCommentID"`
}

type PostCommentLike struct {
	PostCommentID uint      `gorm:"column:post_comment_id;primaryKey"`
	UserID        uint      `gorm:"column:user_id;primaryKey"`
	CreatedAt     time.Time `gorm:"column:created_at;autoCreateTime"`

	PostComment PostComment `gorm:"foreignKey:PostCommentID;references:PostCommentID"`
	User        User        `gorm:"foreignKey:UserID;references:UserID"`
}