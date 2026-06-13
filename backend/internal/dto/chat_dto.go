package dto

import "time"

type SendMessageRequest struct {
	ConversationID  uint    `json:"conversation_id"` // Untuk grup/reply di room yang sama
	TargetUserID    uint    `json:"target_user_id"`  // Untuk inisiasi DM
	Body            string  `json:"body"`
	PostID          *uint   `json:"post_id"`          // ID Postingan yang dishare
	BookID          *uint   `json:"book_id"`   
	ParentMessageID *uint   `json:"parent_message_id"` // ID pesan yang dibalas
}

type ReplyPreviewDTO struct {
	ID       uint   `json:"id"`
	Body     string `json:"body"`
	SenderName string `json:"senderName"`
}

type MessageResponse struct {
	ID             uint             `json:"id"`
	ConversationID uint             `json:"conversationId"`
	SenderID       uint             `json:"senderId"`
	Body           string           `json:"body"`
	MessageType    string           `json:"messageType"`

	SharedPost     *PostSummaryDTO  `json:"sharedPost,omitempty"`
	SharedBook     *BookSummaryDTO  `json:"sharedBook,omitempty"`

	ReplyTo        *ReplyPreviewDTO `json:"replyTo,omitempty"` // Info pesan yang dibalas
	CreatedAt      time.Time        `json:"createdAt"`
}

type ConversationResponseDTO struct {
	ID            uint      `json:"id"`            // ID Room Chat
	PartnerName   string    `json:"partnerName"`   // Nama lawan bicara
	PartnerAvatar string    `json:"partnerAvatar"` // Foto lawan bicara
	LastMessage   string    `json:"lastMessage"`   // Cuplikan pesan terakhir
	UpdatedAt     time.Time `json:"updatedAt"`     // Waktu pesan terakhir
	UnreadCount   int       `json:"unreadCount"`   // (Nanti kita isi di Fase 4)
}

type CreateGroupRequest struct {
	Title     string `json:"title" binding:"required,min=3"`
	MemberIDs []uint `json:"memberIds" binding:"required,min=1"` // Daftar ID teman yang diundang
}

type AddMembersRequest struct {
	MemberIDs []uint `json:"memberIds" binding:"required,min=1"`
}

type RenameGroupRequest struct {
	Title string `json:"title" binding:"required,min=3"`
}

