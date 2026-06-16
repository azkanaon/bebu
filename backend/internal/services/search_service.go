package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"context"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/sync/errgroup"
	"gorm.io/gorm"
)

type SearchService interface {
	// Untuk Tab 'TOP' (Cuplikan 3 kategori sekaligus)
	SearchTop(viewerID *uint, query string) (*dto.SearchTopResponseDTO, error)
	SearchBooks(query string, page, limit int) ([]dto.BookSearchItem, *dto.PaginationDTO, error)
	SearchUsers(viewerID *uint, query string, page, limit int) ([]dto.UserSummaryDTO, *dto.PaginationDTO, error)
	SearchPosts(query string, page, limit int) ([]dto.PostSummaryDTO, *dto.PaginationDTO, error)
	GetMySearchHistory(userID uint) ([]dto.SearchHistoryDTO, error) 
	DeleteHistoryItem(userID uint, logID uint) error
	ClearAllHistory(userID uint) error
	SearchAuthors(query string) ([]dto.SubmissionItemInput, error)
	SearchGenres(query string) ([]dto.SubmissionItemInput, error)
	SearchChatConversations(userID uint, query string) ([]dto.ConversationResponseDTO, error)
	SearchChatMessages(userID uint, query string, page, limit int) ([]dto.MessageSearchResponseDTO, *dto.PaginationDTO, error)
	SearchMessagesInConversation(userID, convID uint, query string, page, limit int) ([]dto.MessageResponse, *dto.PaginationDTO, error)
}

type searchService struct {
	searchRepo repositories.SearchRepository
	userRepo   repositories.UserRepository
	db         *gorm.DB 
}

func NewSearchService(sRepo repositories.SearchRepository, uRepo repositories.UserRepository, db *gorm.DB) SearchService {
	return &searchService{
		searchRepo: sRepo,
		userRepo:   uRepo,
		db:         db,
	}
}

// ==========================================
// 1. SEARCH TOP (LOGIKA CONCURRENCY)
// ==========================================
func (s *searchService) SearchTop(viewerID *uint, query string) (*dto.SearchTopResponseDTO, error) {
	var books []dto.BookSearchItem
	var users []dto.UserSummaryDTO
	var posts []dto.PostSummaryDTO

	// Kita gunakan errgroup agar 3 query jalan barengan di background
	g, _ := errgroup.WithContext(context.Background())

	// A. Mencari Buku (Top 4)
	g.Go(func() error {
		res, _, err := s.searchRepo.SearchBooks(query, 1, 4)
		if err == nil {
			books = s.mapBooksToDTO(res)
		}
		return err
	})

	// B. Mencari User (Top 4)
	g.Go(func() error {
		res, _, err := s.searchRepo.SearchUsers(query, viewerID, 1, 4)
		if err == nil {
			mappedUsers, mapErr := s.mapUsersToDTO(viewerID, res)
			users = mappedUsers
			return mapErr
		}
		return err
	})

	// C. Mencari Post (Top 4)
	g.Go(func() error {
		res, _, err := s.searchRepo.SearchPosts(query, 1, 4)
		if err == nil {
			posts = s.mapPostsToDTO(res)
		}
		return err
	})

	// Tunggu semua goroutine selesai
	if err := g.Wait(); err != nil {
		return nil, fmt.Errorf("search top failed: %w", err)
	}

	trimmedQuery := strings.TrimSpace(query)

	// 2. Hanya simpan jika user login DAN panjang karakter minimal 2
	if viewerID != nil && len(trimmedQuery) >= 2 {
		go func(uid uint, q string) {
			s.searchRepo.SaveSearchHistory(uid, q)
		}(*viewerID, trimmedQuery)
	}

	return &dto.SearchTopResponseDTO{
		Books: books,
		Users: users,
		Posts: posts,
	}, nil
}

// ==========================================
// 2. SEARCH TAB SPESIFIK (PAGINATED)
// ==========================================

func (s *searchService) SearchBooks(query string, page, limit int) ([]dto.BookSearchItem, *dto.PaginationDTO, error) {
	res, total, err := s.searchRepo.SearchBooks(query, page, limit)
	if err != nil {
		return nil, nil, err
	}
	return s.mapBooksToDTO(res), dto.NewPaginationDTO(total, page, limit), nil
}

func (s *searchService) SearchUsers(viewerID *uint, query string, page, limit int) ([]dto.UserSummaryDTO, *dto.PaginationDTO, error) {
	res, total, err := s.searchRepo.SearchUsers(query, viewerID, page, limit)
	if err != nil {
		return nil, nil, err
	}
	
	mappedUsers, err := s.mapUsersToDTO(viewerID, res)
	if err != nil {
		return nil, nil, err
	}
	
	return mappedUsers, dto.NewPaginationDTO(total, page, limit), nil
}

func (s *searchService) SearchPosts(query string, page, limit int) ([]dto.PostSummaryDTO, *dto.PaginationDTO, error) {
	res, total, err := s.searchRepo.SearchPosts(query, page, limit)
	if err != nil {
		return nil, nil, err
	}
	return s.mapPostsToDTO(res), dto.NewPaginationDTO(total, page, limit), nil
}

// ==========================================
// 3. PRIVATE MAPPING HELPERS (CLEAN CODE)
// ==========================================

func (s *searchService) mapBooksToDTO(books []models.Book) []dto.BookSearchItem {
	dtos := make([]dto.BookSearchItem, 0, len(books))
	for _, b := range books {
		var authorNames []string
		for _, ba := range b.BookAuthors {
			if ba.Author.AuthorID > 0 {
				authorNames = append(authorNames, ba.Author.AuthorName)
			}
		}

		dtos = append(dtos, dto.BookSearchItem{
			PublicID:        b.PublicID.String(),
			Title:           b.Title,
			Synopsis:        b.Synopsis,
			CoverImgURL:     b.CoverImgURL,
			PublicationYear: b.PublicationYear,
			Language:        b.Language,
			Authors:         authorNames,
			TotalPages:      b.TotalPages,
			Slug:            b.Slug,
		})
	}
	return dtos
}

func (s *searchService) mapUsersToDTO(viewerID *uint, users []models.User) ([]dto.UserSummaryDTO, error) {
	dtos := make([]dto.UserSummaryDTO, len(users))
	for i, u := range users {
		dtos[i] = dto.UserSummaryDTO{
			Username:    u.Username,
			DisplayName: u.Profile.DisplayName,
			AvatarURL:   u.Profile.AvatarUrl,
		}

		if viewerID != nil {
			myStatus, _ := s.userRepo.GetFollowStatus(*viewerID, u.UserID)
			theirStatus, _ := s.userRepo.GetFollowStatus(u.UserID, *viewerID)

			dtos[i].ViewerContext = &dto.FollowerContextDTO{
				IsFollowing:  (myStatus == "accepted"),
				IsPending:  (myStatus == "pending"),
				IsFollowedBy: (theirStatus == "accepted"),
				IsOwnProfile: (*viewerID == u.UserID),
			}
		}
	}
	return dtos, nil
}

func (s *searchService) mapPostsToDTO(posts []models.Post) []dto.PostSummaryDTO {
	dtos := make([]dto.PostSummaryDTO, 0, len(posts))
	for _, p := range posts {
		rating := float32(p.Rating)
		
		// --- PERBAIKAN 2: Konversi Value ke Pointer ---
		// Kita buat variabel lokal untuk mengambil alamat memorinya
		pubAt := p.PublishedAt 

		postDTO := dto.PostSummaryDTO{
			PublicID:    p.PublicID.String(),
			Description: p.Description,
			ImgURL:      p.ImgURL,
			PostType:    p.PostType,
			Rating:      &rating,
			PublishedAt: &pubAt, // <-- Sekarang sudah jadi *time.Time
			Stats:       dto.PostStatsDTO{},
		}

		// Pengaman: Cek jika Stats ada agar tidak nil pointer panic
		if p.Stats != nil {
			postDTO.Stats.LikeCount = p.Stats.LikeCount
			postDTO.Stats.CommentCount = p.Stats.CommentCount
			postDTO.Stats.SaveCount = p.Stats.SaveCount
		}

		dtos = append(dtos, postDTO)
	}
	return dtos
}

func (s *searchService) GetMySearchHistory(userID uint) ([]dto.SearchHistoryDTO, error) {
    logs, err := s.searchRepo.GetRecentSearches(userID, 10) // Ambil 10 terakhir
    if err != nil { return nil, err }

    var history []dto.SearchHistoryDTO
    for _, log := range logs {
        history = append(history, dto.SearchHistoryDTO{
            ID:    log.SearchLogID,
            Query: log.QueryText,
        })
    }
    return history, nil
}

func (s *searchService) DeleteHistoryItem(userID uint, logID uint) error {
	return s.searchRepo.DeleteSearchHistory(userID, logID)
}

func (s *searchService) ClearAllHistory(userID uint) error {
	return s.searchRepo.ClearAllSearchHistory(userID)
}

// Implementasi SearchAuthors
func (s *searchService) SearchAuthors(query string) ([]dto.SubmissionItemInput, error) {
	res, err := s.searchRepo.SearchAuthorsOnly(query, 3) // Limit 15 saran
	if err != nil { return nil, err }

	dtos := make([]dto.SubmissionItemInput, 0, len(res))
	for _, a := range res {
		dtos = append(dtos, dto.SubmissionItemInput{
			ID:   a.AuthorID,
			Name: a.AuthorName,
		})
	}
	return dtos, nil
}

// Implementasi SearchGenres
func (s *searchService) SearchGenres(query string) ([]dto.SubmissionItemInput, error) {
	res, err := s.searchRepo.SearchGenresOnly(query, 3)
	if err != nil { return nil, err }

	dtos := make([]dto.SubmissionItemInput, 0, len(res))
	for _, g := range res {
		dtos = append(dtos, dto.SubmissionItemInput{
			ID:   g.GenreID,
			Name: g.GenreName,
		})
	}
	return dtos, nil
}

func (s *searchService) SearchChatConversations(userID uint, query string) ([]dto.ConversationResponseDTO, error) {
	if query == "" {
		return []dto.ConversationResponseDTO{}, nil
	}

	convs, err := s.searchRepo.SearchChatConversations(userID, query)
	if err != nil {
		return nil, err
	}

	var response []dto.ConversationResponseDTO
	for _, c := range convs {
		var pName, pAvatar string

		// Gunakan logika yang sama dengan GetInbox
		if c.ConversationType == "group" {
			if c.Title != nil { pName = *c.Title } else { pName = "Grup Tanpa Nama" }
			if c.ImgURL != nil { pAvatar = *c.ImgURL }
		} else {
			// Cari partner di DM
			for _, m := range c.Members {
				if m.UserID != userID {
					pName = m.User.Username
					if m.User.Profile != nil {
						if m.User.Profile.DisplayName != "" { pName = m.User.Profile.DisplayName }
						pAvatar = m.User.Profile.AvatarUrl
					}
					break
				}
			}
		}

		response = append(response, dto.ConversationResponseDTO{
			ID:            c.ConversationID,
			PartnerName:   pName,
			PartnerAvatar: pAvatar,
			LastMessage:   c.LastMessageBody,
			UpdatedAt:     c.UpdatedAt,
			// UnreadCount bisa dikosongkan atau dihitung jika diperlukan
		})
	}

	return response, nil
}

func (s *searchService) SearchChatMessages(userID uint, query string, page, limit int) ([]dto.MessageSearchResponseDTO, *dto.PaginationDTO, error) {
	if query == "" {
		return []dto.MessageSearchResponseDTO{}, dto.NewPaginationDTO(0, page, limit), nil
	}

	msgs, total, err := s.searchRepo.SearchChatMessages(userID, query, page, limit)
	if err != nil {
		return nil, nil, err
	}

	var response []dto.MessageSearchResponseDTO
	for _, m := range msgs {
		roomName := "Grup/Chat"
		
		// Logika menentukan nama ruangan (Sama dengan GetInbox)
		if m.Conversation.ConversationType == "group" && m.Conversation.Title != nil {
			roomName = *m.Conversation.Title
		} else {
			for _, mem := range m.Conversation.Members {
				if mem.UserID != userID {
					roomName = mem.User.Username
					if mem.User.Profile != nil && mem.User.Profile.DisplayName != "" {
						roomName = mem.User.Profile.DisplayName
					}
					break
				}
			}
		}

		bodyText := ""
		if m.Body != nil { bodyText = *m.Body }

		response = append(response, dto.MessageSearchResponseDTO{
			MessageID:      m.MessageID,
			Body:           bodyText,
			CreatedAt:      m.CreatedAt,
			SenderName:     m.Sender.Username, // Bisa gunakan display name juga
			ConversationID: m.ConversationID,
			RoomName:       roomName,
		})
	}

	return response, dto.NewPaginationDTO(total, page, limit), nil
}

func (s *searchService) SearchMessagesInConversation(userID, convID uint, query string, page, limit int) ([]dto.MessageResponse, *dto.PaginationDTO, error) {
	// 1. VALIDASI KEAMANAN: Cek apakah user adalah anggota ruangan ini
	var count int64
	err := s.db.Table("conversation_members").
		Where("conversation_id = ? AND user_id = ?", convID, userID).
		Count(&count).Error

	if err != nil {
		return nil, nil, err
	}

	if count == 0 {
		return nil, nil, errors.New("forbidden: you are not a member of this conversation")
	}

	// 2. EKSEKUSI PENCARIAN
	if query == "" {
		return []dto.MessageResponse{}, dto.NewPaginationDTO(0, page, limit), nil
	}

	msgs, total, err := s.searchRepo.SearchMessagesInConversation(convID, query, page, limit)
	if err != nil { return nil, nil, err }

	// 3. GUNAKAN HELPER MAPPING (Ini yang memperbaiki masalah Anda)
	dtos := s.mapMessagesToDTO(msgs)

	return dtos, dto.NewPaginationDTO(total, page, limit), nil
}

func (s *searchService) mapMessagesToDTO(messages []models.Message) []dto.MessageResponse {
	dtos := make([]dto.MessageResponse, 0, len(messages))
	for _, m := range messages {
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

		// 1. Logic Balasan (Reply)
		if m.ParentMessageID != nil && m.ParentMessage != nil {
			pSenderName := m.ParentMessage.Sender.Username
			if m.ParentMessage.Sender.Profile != nil && m.ParentMessage.Sender.Profile.DisplayName != "" {
				pSenderName = m.ParentMessage.Sender.Profile.DisplayName
			}
			pBody := ""
			if m.ParentMessage.Body != nil { pBody = *m.ParentMessage.Body }

			res.ReplyTo = &dto.ReplyPreviewDTO{
				ID:         m.ParentMessage.MessageID,
				Body:       pBody,
				SenderName: pSenderName,
			}
		}

		// 2. Logic Share Buku
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

		// 3. Logic Share Post
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
	return dtos
}