package dto

import "time"

type SendMessageRequest struct {
	TargetUserID uint   `json:"target_user_id" binding:"required"`
	Body         string `json:"body" binding:"required"`
}

type MessageResponse struct {
	ID             uint      `json:"id"`
	ConversationID uint      `json:"conversationId"`
	SenderID       uint      `json:"senderId"`
	Body           string    `json:"body"`
	CreatedAt      time.Time `json:"createdAt"`
}