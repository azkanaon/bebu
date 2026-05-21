package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"context"
	"fmt"

	"golang.org/x/sync/errgroup"
)

type SearchService interface {
	// Untuk Tab 'TOP' (Cuplikan 3 kategori sekaligus)
	SearchTop(viewerID *uint, query string) (*dto.SearchTopResponseDTO, error)
	
	// Untuk Tab Spesifik (Paginasi lengkap)
	SearchBooks(query string, page, limit int) ([]dto.BookSearchItem, *dto.PaginationDTO, error)
	SearchUsers(viewerID *uint, query string, page, limit int) ([]dto.UserSummaryDTO, *dto.PaginationDTO, error)
	SearchPosts(query string, page, limit int) ([]dto.PostSummaryDTO, *dto.PaginationDTO, error)
	GetMySearchHistory(userID uint) ([]dto.SearchHistoryDTO, error) 
	DeleteHistoryItem(userID uint, logID uint) error
	ClearAllHistory(userID uint) error
}

type searchService struct {
	searchRepo repositories.SearchRepository
	userRepo   repositories.UserRepository
}

func NewSearchService(sRepo repositories.SearchRepository, uRepo repositories.UserRepository) SearchService {
	return &searchService{
		searchRepo: sRepo,
		userRepo:   uRepo,
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

	if viewerID != nil && query != "" {
		// Kita jalankan secara Async (Goroutine) agar tidak memperlambat hasil pencarian
		go func(uid uint, q string) {
			s.searchRepo.SaveSearchHistory(uid, q)
            // (Opsional) Tambahkan logika di repo untuk menghapus data ke-11 jika ingin membatasi cuma 10 riwayat
		}(*viewerID, query)
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
			PublicID:        b.PublicID,
			Title:           b.Title,
			Synopsis:        b.Synopsis,
			CoverImgURL:     b.CoverImgURL,
			PublicationYear: b.PublicationYear,
			Language:        b.Language,
			Authors:         authorNames,
			TotalPages:      b.TotalPages,
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
			PublicID:    p.PublicID,
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