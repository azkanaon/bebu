package dto

import "time"

// SearchTopResponseDTO adalah hasil untuk tab 'TOP'
type SearchTopResponseDTO struct {
	Books []BookSearchItem  `json:"books"`
	Users []UserSummaryDTO  `json:"users"`
	Posts []PostSummaryDTO  `json:"posts"`
}

type SearchHistoryDTO struct {
	ID    uint   `json:"id"`
	Query string `json:"query"`
}

type MessageSearchResponseDTO struct {
	MessageID      uint      `json:"messageId"`
	Body           string    `json:"body"`
	CreatedAt      time.Time `json:"createdAt"`
	SenderName     string    `json:"senderName"`
	SenderAvatar   string    `json:"senderAvatar"`
	ConversationID uint      `json:"conversationId"`
	RoomName       string    `json:"roomName"` // Nama grup atau nama partner DM
}