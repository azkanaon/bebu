package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"backend-bebu/internal/ws"
	"errors"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ChatService interface {
	SendMessage(senderID uint, req dto.SendMessageRequest) (*dto.MessageResponse, error)
	GetInbox(userID uint) ([]dto.ConversationResponseDTO, error)
	GetMessages(userID, convID uint, page, limit int) ([]dto.MessageResponse, *dto.PaginationDTO, error)
	MarkAsRead(userID, convID uint) error
	CreateGroup(ownerID uint, req dto.CreateGroupRequest) (*dto.ConversationResponseDTO, error)
	AddMembers(adminID, convID uint, targetUserIDs []uint) error
	RenameGroup(adminID, convID uint, newTitle string) error
	LeaveGroup(userID, convID uint) error
	KickMember(adminID, convID, targetUserID uint) error
}

type chatService struct {
	repo     repositories.ChatRepository
	userRepo repositories.UserRepository
	hub          *ws.Hub
	db       *gorm.DB
}

func NewChatService(repo repositories.ChatRepository, uRepo repositories.UserRepository, hub *ws.Hub, db *gorm.DB) ChatService {
	return &chatService{repo: repo, userRepo: uRepo, hub: hub, db: db}
}

func (s *chatService) SendMessage(senderID uint, req dto.SendMessageRequest) (*dto.MessageResponse, error) {
	var conversation *models.Conversation
	var newMessage *models.Message
	now := time.Now()

	// 1. Tentukan/Cari Ruang Percakapan
	err := s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.repo.WithTx(tx)

		msgType := "text"
		if req.PostID != nil {
			msgType = "share_post"
		} else if req.BookID != nil {
			msgType = "share_book"
		}

		if req.ConversationID > 0 {
			// --- SKENARIO A: Kirim ke Room yang sudah ada ---
			conv, err := txRepo.FindConversationByID(req.ConversationID)
			if err != nil {
				return errors.New("conversation room not found")
			}
			
			// Validasi: Apakah pengirim benar-benar anggota di room ini?
			isMember := false
			for _, m := range conv.Members {
				if m.UserID == senderID { isMember = true; break }
			}
			if !isMember { return errors.New("forbidden: you are not a member of this room") }
			
			conversation = conv
		} else if req.TargetUserID > 0 {
			// --- SKENARIO B: Kirim ke Orang (Cari/Buat DM) ---
			if senderID == req.TargetUserID { return errors.New("cannot message yourself") }

			conv, err := txRepo.FindDirectConversation(senderID, req.TargetUserID)
			if err != nil {
				// Buat baru jika belum pernah chat
				newConv := &models.Conversation{
					CreatedByUserID:  senderID,
					ConversationType: "direct",
					LastMessageAt:    &now,
					Members: []models.ConversationMember{
						{UserID: senderID, Role: "admin"},
						{UserID: req.TargetUserID, Role: "member"},
					},
				}
				if err := txRepo.CreateConversation(newConv); err != nil { return err }
				conversation = newConv
			} else {
				conversation = conv
			}
		} else {
			return errors.New("must provide either conversation_id or target_user_id")
		}

		// 2. Update Header Percakapan (Pesan Terakhir)
		tx.Model(&models.Conversation{}).
			Where("conversation_id = ?", conversation.ConversationID).
			Updates(map[string]interface{}{
				"last_message_body": req.Body,
				"last_message_at":   now,
			})

		// 3. Simpan Pesan Baru
		newMessage = &models.Message{
			ConversationID:  conversation.ConversationID,
			SenderUserID:    senderID,
			Body:            &req.Body,
			MessageType:     msgType,
			PostID:          req.PostID,
			BookID:          req.BookID,
			ParentMessageID: req.ParentMessageID,
		}
		return txRepo.CreateMessage(newMessage)
	})

	if err != nil { return nil, err }

	// 4. Mapping Response & WebSocket (Penyempurnaan Broadcast)
	res := &dto.MessageResponse{
		ID:             newMessage.MessageID,
		ConversationID: conversation.ConversationID,
		SenderID:       senderID,
		Body:           req.Body,
		CreatedAt:      newMessage.CreatedAt,
		MessageType:    newMessage.MessageType,
	}

	// Jika ini adalah sebuah reply, kita ambil info singkat untuk WebSocket
    if req.ParentMessageID != nil {
		parentMsg, err := s.repo.FindMessageByID(*req.ParentMessageID)
		if err == nil && parentMsg != nil {
			// Tentukan nama pengirim (DisplayName atau Username)
			senderName := parentMsg.Sender.Username
			if parentMsg.Sender.Profile != nil && parentMsg.Sender.Profile.DisplayName != "" {
				senderName = parentMsg.Sender.Profile.DisplayName
			}

			// Masukkan ke DTO
			res.ReplyTo = &dto.ReplyPreviewDTO{
				ID:         parentMsg.MessageID,
				Body:       *parentMsg.Body, // Ambil cuplikan teksnya
				SenderName: senderName,
			}
		}
	}

	go func() {
		chatEvent := gin.H{"type": "NEW_MESSAGE", "payload": res}
		
		// Kirim ke SEMUA anggota grup/DM kecuali pengirim sendiri
		for _, m := range conversation.Members {
			if m.UserID != senderID {
				s.hub.SendToUser(m.UserID, chatEvent)
			}
		}
	}()
	// Ambil newMessage.MessageID dan masukkan ke DTO
	return res, nil
}

func (s *chatService) GetInbox(userID uint) ([]dto.ConversationResponseDTO, error) {
	// 1. Ambil data dari repo
	convs, err := s.repo.GetUserConversations(userID)
	if err != nil {
		return nil, err
	}

	var response []dto.ConversationResponseDTO
	for _, c := range convs {
		var pName string
		var pAvatar string

		// --- LOGIKA CABANG: GRUP VS DM ---
		if c.ConversationType == "group" {
			// JIKA GRUP: Gunakan judul grup dan foto grup
			if c.Title != nil {
				pName = *c.Title
			} else {
				pName = "Grup Tanpa Nama"
			}
			
			if c.ImgURL != nil {
				pAvatar = *c.ImgURL
			}
		} else {
			// JIKA DM: Cari satu member yang bukan diri saya sendiri
			var partner models.User
			found := false
			for _, m := range c.Members {
				if m.UserID != userID {
					partner = m.User
					found = true
					break
				}
			}

			if found {
				// Gunakan DisplayName, fallback ke Username
				pName = partner.Username
				if partner.Profile != nil && partner.Profile.DisplayName != "" {
					pName = partner.Profile.DisplayName
				}
				if partner.Profile != nil {
					pAvatar = partner.Profile.AvatarUrl
				}
			} else {
				pName = "User Tidak Dikenal"
			}
		}

		// --- HITUNG UNREAD COUNT ---
		lastReadID := uint(0)
		for _, m := range c.Members {
			if m.UserID == userID && m.LastReadMessageID != nil {
				lastReadID = *m.LastReadMessageID
				break
			}
		}
		unread, _ := s.repo.GetUnreadCount(c.ConversationID, userID, lastReadID)

		// --- RAKIT DTO ---
		response = append(response, dto.ConversationResponseDTO{
			ID:            c.ConversationID,
			PartnerName:   pName,
			PartnerAvatar: pAvatar,
			LastMessage:   c.LastMessageBody,
			UpdatedAt:     c.UpdatedAt,
			UnreadCount:   unread,
		})
	}

	return response, nil
}

func (s *chatService) GetMessages(userID, convID uint, page, limit int) ([]dto.MessageResponse, *dto.PaginationDTO, error) {
	// 1. Validasi Akses: Apakah user ini anggota room ini?
	isMember, err := s.repo.IsMember(convID, userID)
	if err != nil || !isMember {
		return nil, nil, errors.New("forbidden: you are not a member of this conversation")
	}

	// 2. Ambil data pesan dari repo
	// PENTING: Pastikan repository melakukan Preload untuk:
	// "Sender.Profile", "ParentMessage.Sender.Profile", "Post.User.Profile", "Book.BookAuthors.Author"
	messages, total, err := s.repo.GetMessages(convID, page, limit)
	if err != nil {
		return nil, nil, err
	}

	// 3. Mapping ke DTO
	var dtos []dto.MessageResponse
	for _, m := range messages {
		// --- A. DATA DASAR ---
		bodyText := ""
		if m.Body != nil {
			bodyText = *m.Body
		}

		res := dto.MessageResponse{
			ID:             m.MessageID,
			ConversationID: m.ConversationID,
			SenderID:       m.SenderUserID,
			Body:           bodyText,
			MessageType:    m.MessageType,
			CreatedAt:      m.CreatedAt,
		}

		// --- B. LOGIKA REPLY (BALASAN) ---
		// Jika pesan ini merujuk ke pesan lain (parent)
		if m.ParentMessageID != nil && m.ParentMessage != nil {
			pSenderName := m.ParentMessage.Sender.Username
			if m.ParentMessage.Sender.Profile != nil && m.ParentMessage.Sender.Profile.DisplayName != "" {
				pSenderName = m.ParentMessage.Sender.Profile.DisplayName
			}

			pBody := ""
			if m.ParentMessage.Body != nil {
				pBody = *m.ParentMessage.Body
			}

			res.ReplyTo = &dto.ReplyPreviewDTO{
				ID:         m.ParentMessage.MessageID,
				Body:       pBody,
				SenderName: pSenderName,
			}
		}

		// --- C. LOGIKA SHARE BUKU ---
		if m.MessageType == "share_book" && m.Book != nil {
			var authorNames []string
			for _, ba := range m.Book.BookAuthors {
				if ba.Author.AuthorID > 0 {
					authorNames = append(authorNames, ba.Author.AuthorName)
				}
			}
			res.SharedBook = &dto.BookSummaryDTO{
				PublicID:    m.Book.PublicID.String(),
				Title:       m.Book.Title,
				CoverImgURL: m.Book.CoverImgURL,
				Authors:     authorNames,
			}
		}

		// --- D. LOGIKA SHARE POSTINGAN ---
		if m.MessageType == "share_post" && m.Post != nil {
			pDisplayName := m.Post.User.Username
			if m.Post.User.Profile != nil && m.Post.User.Profile.DisplayName != "" {
				pDisplayName = m.Post.User.Profile.DisplayName
			}

			res.SharedPost = &dto.PostSummaryDTO{
				PublicID:    m.Post.PublicID.String(),
				Description: m.Post.Description,
				ImgURL:      m.Post.ImgURL,
				User: dto.PostUserDTO{
					Username:    m.Post.User.Username,
					DisplayName: pDisplayName,
					AvatarURL:   m.Post.User.Profile.AvatarUrl,
				},
			}
		}

		dtos = append(dtos, res)
	}

	return dtos, dto.NewPaginationDTO(total, page, limit), nil
}

func (s *chatService) MarkAsRead(userID, convID uint) error {
	// A. Cari ID pesan paling terakhir di room tersebut
	var lastMsg models.Message
	err := s.db.Where("conversation_id = ?", convID).Order("message_id DESC").First(&lastMsg).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) { return nil }
		return err
	}

	// B. Update LastReadMessageID milik user di room tersebut
	return s.repo.MarkAsRead(convID, userID, lastMsg.MessageID)
}

func (s *chatService) CreateGroup(ownerID uint, req dto.CreateGroupRequest) (*dto.ConversationResponseDTO, error) {
	now := time.Now()
	
	// Siapkan data member (Owner + Member yang diundang)
	members := []models.ConversationMember{
		{UserID: ownerID, Role: "admin", JoinedAt: now},
	}
	
	for _, id := range req.MemberIDs {
		members = append(members, models.ConversationMember{
			UserID:   id,
			Role:     "member",
			JoinedAt: now,
		})
	}

	newGroup := &models.Conversation{
		CreatedByUserID:  ownerID,
		ConversationType: "group",
		Title:            &req.Title,
		LastMessageAt:    &now,
		Members:          members,
		LastMessageBody:  "Grup baru dibuat",
	}

	err := s.db.Transaction(func(tx *gorm.DB) error {
		// 1. Simpan Group & Members
		if err := tx.Create(newGroup).Error; err != nil {
			return err
		}

		// --- 2. KIRIM PESAN SISTEM PERTAMA ---
		systemText := fmt.Sprintf("Grup '%s' berhasil dibuat", req.Title)
		return s.sendSystemMessage(tx, newGroup.ConversationID, systemText)
	})

	if err != nil { return nil, err }

	sysMsg := &models.Message{
		ConversationID: newGroup.ConversationID,
		SenderUserID:   ownerID, 
		Body:           &newGroup.LastMessageBody,
		MessageType:    "system",
	}
	s.repo.CreateMessage(sysMsg)

	return &dto.ConversationResponseDTO{
		ID:            newGroup.ConversationID,
		PartnerName:   *newGroup.Title,
		LastMessage:   newGroup.LastMessageBody,
		UpdatedAt:     newGroup.CreatedAt,
		UnreadCount:   0,
	}, nil
}

func (s *chatService) sendSystemMessage(tx *gorm.DB, convID uint, text string) error {
	now := time.Now()
	
	// 1. Simpan pesan ke tabel messages
	msg := &models.Message{
		ConversationID: convID,
		SenderUserID:   1, // Kita asumsikan ID 1 adalah ID 'System' atau 'Admin'
		Body:           &text,
		MessageType:    "system", // <-- Mark as system
	}
	
	if err := tx.Create(msg).Error; err != nil {
		return err
	}

	// 2. Update last_message_body di tabel conversations agar muncul di Inbox
	return tx.Model(&models.Conversation{}).
		Where("conversation_id = ?", convID).
		Updates(map[string]interface{}{
			"last_message_body": text,
			"last_message_at":   now,
		}).Error
}

func (s *chatService) AddMembers(adminID, convID uint, targetUserIDs []uint) error {
	// A. Cek apakah yang melakukan adalah Admin
	isAdmin, _ := s.repo.IsAdmin(convID, adminID)
	if !isAdmin {
		return errors.New("forbidden: only admin can add members")
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.repo.WithTx(tx)

		var members []models.ConversationMember
		for _, uid := range targetUserIDs {
			members = append(members, models.ConversationMember{
				ConversationID: convID,
				UserID:         uid,
				Role:           "member",
				JoinedAt:       time.Now(),
			})
		}

		// Simpan member baru
		if err := txRepo.AddMembers(members); err != nil {
			return err
		}

		// Kirim Pesan Sistem
		return s.sendSystemMessage(tx, convID, "Beberapa anggota baru telah ditambahkan ke grup")
	})
}

// 3. Implementasi RenameGroup
func (s *chatService) RenameGroup(adminID, convID uint, newTitle string) error {
	// A. Ambil data room untuk pastikan ini tipe 'group'
	conv, err := s.repo.FindConversationByID(convID)
	if err != nil { return errors.New("group not found") }
	
	if conv.ConversationType != "group" {
		return errors.New("cannot rename a direct message")
	}

	// B. Cek Hak Akses Admin
	isAdmin, _ := s.repo.IsAdmin(convID, adminID)
	if !isAdmin {
		return errors.New("forbidden: only admin can rename the group")
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.repo.WithTx(tx)

		// Simpan Nama Baru
		if err := txRepo.UpdateConversationTitle(convID, newTitle); err != nil {
			return err
		}

		// Kirim Pesan Sistem
		systemText := fmt.Sprintf("Nama grup diubah menjadi '%s'", newTitle)
		return s.sendSystemMessage(tx, convID, systemText)
	})
}

func (s *chatService) LeaveGroup(userID uint, convID uint) error {
	// A. Ambil data user untuk nama di pesan sistem
	user, _ := s.userRepo.FindUserByID(userID)

	return s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.repo.WithTx(tx)

		// B. Hapus dari member
		if err := txRepo.RemoveMember(convID, userID); err != nil {
			return err
		}

		// C. Kirim Pesan Sistem
		systemText := fmt.Sprintf("%s telah keluar dari grup", user.Username)
		return s.sendSystemMessage(tx, convID, systemText)
	})
}

// 3. Implementasi KickMember
func (s *chatService) KickMember(adminID, convID, targetUserID uint) error {
	// A. Cek apakah yang melakukan adalah Admin
	isAdmin, _ := s.repo.IsAdmin(convID, adminID)
	if !isAdmin {
		return errors.New("forbidden: only admin can kick members")
	}

	targetUser, _ := s.userRepo.FindUserByID(targetUserID)

	return s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.repo.WithTx(tx)

		if err := txRepo.RemoveMember(convID, targetUserID); err != nil {
			return err
		}

		systemText := fmt.Sprintf("%s telah dikeluarkan dari grup", targetUser.Username)
		return s.sendSystemMessage(tx, convID, systemText)
	})
}