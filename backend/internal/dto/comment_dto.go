package dto

import "time"

type CommentResponse struct {
	ID           uint              `json:"id"`
	UserID       uint              `json:"user_id"`
	UserPublicID string            `json:"user_public_id"`
	Username     string            `json:"username"`
	Avatar       string            `json:"avatar"`
	Comment      string            `json:"comment"`
	LikeCount    int               `json:"likeCount"`
	IsLiked      bool              `json:"isLiked"`
	Replies      []CommentResponse `json:"replies"`
	CreatedAt    time.Time         `json:"created_at"`
}

type CreateCommentRequest struct {
	PostID          uint   `json:"post_id" binding:"required"`
	ParentCommentID *uint  `json:"parent_comment_id"`
	Comment         string `json:"comment" binding:"required"`
}
