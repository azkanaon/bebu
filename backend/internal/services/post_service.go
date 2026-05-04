package services

import (
	"errors"

	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"backend-bebu/internal/utils"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostService interface {
	GetPosts() ([]interface{}, error)
	CreatePost(req dto.CreatePostRequest) error
	GetUserPosts(viewerID *uint, targetUsername string, page, limit int) ([]dto.PostSummaryDTO, *dto.PaginationDTO, error)
	GetUserLikedPosts(viewerID *uint, targetUsername string, page, limit int) ([]dto.PostSummaryDTO, *dto.PaginationDTO, error)
	GetUserSavedPosts(viewerID *uint, targetUsername string, page, limit int) ([]dto.PostSummaryDTO, *dto.PaginationDTO, error)
}


// --- 2. Buat Struct Implementasi (Privat) ---
type postService struct {
	postRepo repositories.PostRepository // Dependensi ke interface PostRepository
	userRepo repositories.UserRepository // Dependensi ke interface UserRepository
	db       *gorm.DB                      // DB untuk transaksi
}


// --- 3. Buat "Pabrik" (Factory Function) ---
func NewPostService(postRepo repositories.PostRepository, userRepo repositories.UserRepository, db *gorm.DB) PostService {
	return &postService{
		postRepo: postRepo,
		userRepo: userRepo,
		db:       db,
	}
}

// GetPosts (Fungsi lama Anda, sedikit disederhanakan)
func (s *postService) GetPosts() ([]interface{}, error) {
	posts, err := s.postRepo.GetAllPosts()
	if err != nil {
		return nil, err
	}

	// Di sini Anda bisa memindahkan logika mapping ke paket 'mapper' jika ada
	var result []interface{}
	for _, p := range posts {
		// Asumsi mapper.To... mengembalikan DTO yang sesuai
		if p.PostType == "review" {
			// result = append(result, mapper.ToReviewPostResponse(p))
		} else if p.PostType == "analysis" {
			// result = append(result, mapper.ToAnalysisPostResponse(p))
		}
	}

	return result, nil
}

func (s *postService) CreatePost(req dto.CreatePostRequest) error {
	// 1. Mulai Transaksi
	tx := s.db.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	// Defer Rollback akan membatalkan transaksi jika terjadi error/panic di mana pun.
	defer tx.Rollback()

	// 2. Siapkan model Post
	post := &models.Post{
		PublicID:      uuid.New().String(), // Asumsi PublicID Anda string
		UserID:        req.UserID,
		BookID:        req.BookID,
		Description:   req.Description,
		PostType:      req.PostType,
		Rating:        req.Rating,
		ImgURL:        req.ImgURL,
		PublishStatus: "draft", // Default status saat dibuat
	}

	// 3. Buat Post utama menggunakan repository yang terikat transaksi
	// Anda perlu menambahkan WithTx ke PostRepository
	txRepo := s.postRepo.WithTx(tx)
	createdPost, err := txRepo.CreatePost(post)
	if err != nil {
		return err // Rollback akan dijalankan oleh defer
	}


	// --- BAGIAN YANG DILENGKAPI ---
	// 4. Proses Kategori jika post-nya adalah tipe 'analysis'
	if req.PostType == "analysis" && req.Categories != nil {
		for _, categoryName := range req.Categories {
			// Normalisasi nama kategori untuk pencarian yang konsisten
			normalizedName := utils.NormalizeCategory(categoryName)
			
			var category models.Category

			// Cari kategori di DB menggunakan handle transaksi 'tx'
			err := tx.Where("category_normalized = ?", normalizedName).First(&category).Error

			if errors.Is(err, gorm.ErrRecordNotFound) {
				// KATEGORI TIDAK DITEMUKAN: Buat yang baru
				category = models.Category{
					CategoryName:       categoryName,
					CategoryNormalized: normalizedName,
					UsageCount:         1, // Pertama kali digunakan
				}
				if err := tx.Create(&category).Error; err != nil {
					return err // Gagal membuat kategori, Rollback akan dijalankan
				}
			} else if err != nil {
				// Error lain saat mencari kategori
				return err // Rollback akan dijalankan
			} else {
				// KATEGORI DITEMUKAN: Tambah usage_count
				if err := tx.Model(&category).Update("usage_count", gorm.Expr("usage_count + 1")).Error; err != nil {
					return err // Gagal update, Rollback akan dijalankan
				}
			}

			// Buat relasi di tabel post_categories
			postCategory := models.PostCategory{
				PostID:     createdPost.PostID,
				CategoryID: category.CategoryID,
			}
			if err := tx.Create(&postCategory).Error; err != nil {
				return err // Gagal membuat relasi, Rollback akan dijalankan
			}
		}
	}
	// --- AKHIR BAGIAN YANG DILENGKAPI ---


	// 5. Jika semua operasi di atas berhasil, Commit transaksi
	return tx.Commit().Error
}

func (s *postService) GetUserPosts(viewerID *uint, targetUsername string, page, limit int) ([]dto.PostSummaryDTO, *dto.PaginationDTO, error) {
	// 1. Cek akses
	targetUser, hasAccess, err := s.hasProfileAccess(viewerID, targetUsername)
	if err != nil {
		return nil, nil, err
	}
	if !hasAccess {
		return make([]dto.PostSummaryDTO, 0), dto.NewPaginationDTO(0, page, limit), nil
	}

	// 2. Panggil repository
	posts, total, err := s.postRepo.GetPostsByUserID(targetUser.UserID, page, limit)
	if err != nil {
		return nil, nil, err
	}

	// 3. Map ke DTO dan buat paginasi
	dtos := s.mapPostsToSummaryDTOs(posts)
	pagination := dto.NewPaginationDTO(total, page, limit)

	return dtos, pagination, nil
}

func (s *postService) GetUserLikedPosts(viewerID *uint, targetUsername string, page, limit int) ([]dto.PostSummaryDTO, *dto.PaginationDTO, error) {
	// 1. Cek akses (menggunakan kembali helper yang sama)
	targetUser, hasAccess, err := s.hasProfileAccess(viewerID, targetUsername)
	if err != nil {
		return nil, nil, err
	}
	if !hasAccess {
		return make([]dto.PostSummaryDTO, 0), dto.NewPaginationDTO(0, page, limit), nil
	}

	// 2. Panggil repository yang berbeda
	posts, total, err := s.postRepo.GetLikedPostsByUserID(targetUser.UserID, page, limit)
	if err != nil {
		return nil, nil, err
	}

	// 3. Map ke DTO dan buat paginasi (menggunakan kembali helper yang sama)
	dtos := s.mapPostsToSummaryDTOs(posts)
	pagination := dto.NewPaginationDTO(total, page, limit)

	return dtos, pagination, nil
}

func (s *postService) GetUserSavedPosts(viewerID *uint, targetUsername string, page, limit int) ([]dto.PostSummaryDTO, *dto.PaginationDTO, error) {
	// 1. Cek akses (menggunakan kembali helper yang sama)
	targetUser, hasAccess, err := s.hasProfileAccess(viewerID, targetUsername)
	if err != nil {
		return nil, nil, err
	}
	if !hasAccess {
		return make([]dto.PostSummaryDTO, 0), dto.NewPaginationDTO(0, page, limit), nil
	}

	// 2. Panggil repository yang berbeda (untuk saved posts)
	posts, total, err := s.postRepo.GetSavedPostsByUserID(targetUser.UserID, page, limit)
	if err != nil {
		return nil, nil, err
	}

	// 3. Map ke DTO dan buat paginasi (menggunakan kembali helper yang sama)
	dtos := s.mapPostsToSummaryDTOs(posts)
	pagination := dto.NewPaginationDTO(total, page, limit)

	return dtos, pagination, nil
}



func (s *postService) hasProfileAccess(viewerID *uint, targetUsername string) (*models.User, bool, error) {
	targetUser, err := s.userRepo.FindByUsername(targetUsername)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, false, nil // Tidak ditemukan, akses tidak ada, tapi bukan error
		}
		return nil, false, err // Error database
	}

	if viewerID != nil {
		isOwnProfile := (*viewerID == targetUser.UserID)
		if isOwnProfile {
			return targetUser, true, nil // Pemilik selalu punya akses
		}
		
		isBlocked, err := s.userRepo.IsBlocked(targetUser.UserID, *viewerID)
		if err != nil {
			return nil, false, err
		}
		if isBlocked {
			return nil, false, nil // Jika diblokir, tidak ada akses
		}
	}

	isProfilePublic := (targetUser.Settings == nil || targetUser.Settings.IsProfilePublic)
	if isProfilePublic {
		return targetUser, true, nil // Profil publik, semua punya akses
	}

	if viewerID != nil {
		followStatus, err := s.userRepo.GetFollowStatus(*viewerID, targetUser.UserID)
		if err != nil {
			return nil, false, err
		}
		if followStatus == "accepted" {
			return targetUser, true, nil // Follower yang diterima punya akses
		}
	}

	// Jika semua kondisi di atas tidak terpenuhi (profil privat, bukan follower), tidak ada akses.
	return targetUser, false, nil
}

// mapPostsToSummaryDTOs adalah helper untuk mengubah slice model Post ke slice DTO.
func (s *postService) mapPostsToSummaryDTOs(posts []models.Post) []dto.PostSummaryDTO {
	dtos := make([]dto.PostSummaryDTO, 0, len(posts))
	for _, post := range posts {
		rating := float32(post.Rating)
		publishedAt := post.PublishedAt
		postDTO := dto.PostSummaryDTO{
			PublicID:    post.PublicID,
			Description: post.Description,
			ImgURL:      post.ImgURL,
			PostType:    post.PostType,
			Rating:      &rating,
			PublishedAt: &publishedAt,
			Stats:       dto.PostStatsDTO{},
		}

		if post.Stats.PostID > 0 {
			postDTO.Stats.LikeCount = post.Stats.LikeCount
			postDTO.Stats.CommentCount = post.Stats.CommentCount
			postDTO.Stats.SaveCount = post.Stats.SaveCount
		}

		if post.Book != nil && post.Book.BookID > 0 {
			var authorNames []string
			if post.Book.BookAuthors != nil {
				for _, ba := range post.Book.BookAuthors {
					if ba.Author.AuthorID > 0 {
						authorNames = append(authorNames, ba.Author.AuthorName)
					}
				}
			}
			postDTO.Book = &dto.BookSummaryDTO{
				PublicID:    post.Book.PublicID,
				Title:       post.Book.Title,
				CoverImgURL: post.Book.CoverImgURL,
				Authors:     authorNames,
			}
		}
		dtos = append(dtos, postDTO)
	}
	return dtos
}