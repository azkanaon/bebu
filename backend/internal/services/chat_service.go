package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"time"

	"gorm.io/gorm"
)

type ChatService interface {
	SendMessage(senderID uint, req dto.SendMessageRequest) (*dto.MessageResponse, error)
}

type chatService struct {
	repo     repositories.ChatRepository
	userRepo repositories.UserRepository
	db       *gorm.DB
}

func NewChatService(repo repositories.ChatRepository, uRepo repositories.UserRepository, db *gorm.DB) ChatService {
	return &chatService{repo: repo, userRepo: uRepo, db: db}
}

func (s *chatService) SendMessage(senderID uint, req dto.SendMessageRequest) (*dto.MessageResponse, error) {
	var conversation *models.Conversation
	now := time.Now()

	// Gunakan Transaksi agar pembuatan room dan pesan sinkron
	err := s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.repo.WithTx(tx)

		// 1. Cari apakah sudah ada percakapan DM antara mereka
		conv, err := txRepo.FindDirectConversation(senderID, req.TargetUserID)
		
		if err != nil {
			// 2. Jika tidak ditemukan, buat percakapan baru
			newConv := &models.Conversation{
				CreatedByUserID:  senderID,
				ConversationType: "direct",
				LastMessageAt:    &now,
				Members: []models.ConversationMember{
					{UserID: senderID, Role: "admin"},
					{UserID: req.TargetUserID, Role: "member"},
				},
			}
			if err := txRepo.CreateConversation(newConv); err != nil {
				return err
			}
			conversation = newConv
		} else {
			conversation = conv
			// Update timestamp pesan terakhir
			txRepo.UpdateLastMessage(conversation.ConversationID, now)
		}

		// 3. Simpan Pesan Baru
		msg := &models.Message{
			ConversationID: conversation.ConversationID,
			SenderUserID:   senderID,
			Body:           &req.Body,
			MessageType:    "text",
		}
		
		return txRepo.CreateMessage(msg)
	})

	if err != nil {
		return nil, err
	}

	// 4. Return DTO (nanti pesan dikirim lewat ID yang terisi otomatis)
	// Kita butuh ambil pesan terakhir untuk mendapatkan ID-nya jika diperlukan
    // Untuk saat ini kita return sederhana dulu
	return &dto.MessageResponse{
		ConversationID: conversation.ConversationID,
		SenderID:       senderID,
		Body:           req.Body,
		CreatedAt:      now,
	}, nil
}