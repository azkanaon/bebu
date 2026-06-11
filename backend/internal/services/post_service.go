package services

import (
	"errors"
	"fmt"

	"backend-bebu/internal/dto"
	"backend-bebu/internal/mapper"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"backend-bebu/pkg/utils"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostService interface {
	GetPosts(userID uint, tab string, cursor uint, limit int, categoryID uint) ([]interface{}, error)
	GetPostByPublicID(userID uint, publicID string) (interface{}, error)
	CreatePost(req dto.CreatePostRequest) error
	DeletePost(publicID string, userID uint) error
	GetUserPosts(viewerID *uint, targetUsername string, page, limit int) ([]dto.PostSummaryDTO, *dto.PaginationDTO, error)
	GetUserLikedPosts(viewerID *uint, targetUsername string, page, limit int) ([]dto.PostSummaryDTO, *dto.PaginationDTO, error)
	GetUserSavedPosts(viewerID *uint, targetUsername string, page, limit int) ([]dto.PostSummaryDTO, *dto.PaginationDTO, error)
	ToggleLike(postID uint, userID uint) (bool, error)
	ToggleSave(userID uint, postID uint) (bool, error)
	GetComments(postID uint, userID uint) ([]dto.CommentResponse, error)
}


type postService struct {
	postRepo repositories.PostRepository
	userRepo repositories.UserRepository
	bookshelfRepo repositories.BookshelfRepository
	categoryRepo repositories.CategoryRepository
	notifService  NotificationService // <-- TAMBAHKAN INI
	db       *gorm.DB
}


func NewPostService(postRepo repositories.PostRepository, userRepo repositories.UserRepository, categoryRepo repositories.CategoryRepository,bookshelfRepo repositories.BookshelfRepository,notifService NotificationService, db *gorm.DB) PostService {
	return &postService{
		postRepo: postRepo,
		userRepo: userRepo,
		categoryRepo: categoryRepo,
		bookshelfRepo: bookshelfRepo, 
		notifService:  notifService,
		db:       db,
	}
}

func (s *postService) GetPosts(userID uint, tab string, cursor uint, limit int, categoryID uint) ([]interface{}, error) {
    // Teruskan categoryID ke repo
    posts, err := s.postRepo.GetPosts(userID, tab, cursor, limit, categoryID)
    if err != nil {
        return nil, err
    }

    var result []interface{}
    for _, p := range posts {
        if p.PostType == "review" {
            result = append(result, mapper.ToReviewPostResponse(p, userID))
        } else if p.PostType == "analysis" {
            result = append(result, mapper.ToAnalysisPostResponse(p, userID))
        }
    }
    return result, nil
}

func (s *postService) GetPostByPublicID(userID uint, publicID string) (interface{}, error) {
	post, err := s.postRepo.GetPostByPublicID(userID, publicID)
	if err != nil {
		return nil, err
	}

	// Menggunakan mapper yang disesuaikan dengan PostType
	if post.PostType == "review" {
		return mapper.ToReviewPostResponse(post, userID), nil
	} else if post.PostType == "analysis" {
		return mapper.ToAnalysisPostResponse(post, userID), nil
	}

	return nil, errors.New("invalid post type")
}

func (s *postService) CreatePost(req dto.CreatePostRequest) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.postRepo.WithTx(tx)
		txUserRepo := s.userRepo.WithTx(tx)
		txBookRepo := s.bookshelfRepo.WithTx(tx) // Pastikan bookshelfRepo sudah di-inject di postService

		// A. Simpan data Post utama
		post := &models.Post{
			PublicID:      uuid.New(),
			UserID:        req.UserID,
			BookID:        req.BookID,
			Description:   req.Description,
			PostType:      req.PostType,
			Rating:        req.Rating,
			ImgURL:        req.ImgURL,
			PublishStatus: "published",
		}

		createdPost, err := txRepo.CreatePost(post)
		if err != nil {
			return err
		}

		// B. Inisialisasi statistik postingan itu sendiri (untuk like/komen nantinya)
		if err := tx.Create(&models.PostStat{PostID: createdPost.PostID}).Error; err != nil {
			return err
		}

		// C. Logika Kategori (Jika post tipe Analysis)
		if req.PostType == "analysis" && req.Categories != nil {
			for _, categoryName := range req.Categories {
				normalizedName := utils.NormalizeCategory(categoryName)
				var category models.Category

				if err := tx.Where("category_normalized = ?", normalizedName).First(&category).Error; err != nil {
					 if errors.Is(err, gorm.ErrRecordNotFound) { 
					category = models.Category{
						CategoryName:       categoryName, 
						CategoryNormalized: normalizedName, 
						UsageCount:         1,
					}
					// Pastikan menangkap error saat Create
					if err := tx.Create(&category).Error; err != nil {
						return err
					}
				} else { 
					return err 
				}
				} else {
					tx.Model(&category).Update("usage_count", gorm.Expr("usage_count + 1"))
				}
				tx.Create(&models.PostCategory{PostID: createdPost.PostID, CategoryID: category.CategoryID})
			}
		}

		// --- BAGIAN SYNC STATISTIK (PROSES INTI) ---

		// D. SYNC SKOR USER: Tambah total_posts user (+1) & hitung ulang Hot Score Profil
		if err := txUserRepo.SyncUserStats(tx, req.UserID, "total_posts", 1); err != nil {
			return err
		}

		// E. SYNC SKOR BUKU (Jika postingan ini terkait dengan buku)
		if createdPost.BookID > 0 {
			fmt.Println("DEBUG: Masuk ke SyncBookStats untuk BookID:", createdPost.BookID)
			// 1. Tambah total_posts buku tersebut (+1) & hitung ulang Hot Score Buku
			// Ini berlaku untuk SEMUA tipe postingan (review/analysis/dll)
			if err := txBookRepo.SyncBookStats(tx, createdPost.BookID, "total_posts", 1); err != nil {
				return err
			}

			// 2. Jika tipenya REVIEW, proses Rating dan Total Reviews
			if createdPost.PostType == "review" && createdPost.Rating > 0 {
				fmt.Println("DEBUG: Masuk ke SyncBookRating. Rating:", createdPost.Rating)
				ratingVal := float32(createdPost.Rating)
			
			// Panggil tanpa tanda bintang (*)
				if err := txBookRepo.SyncBookRating(tx, createdPost.BookID, ratingVal, false); err != nil {
					return err
				}
			}
		}

		return nil
	})
}

func (s *postService) DeletePost(publicID string, userID uint) error {
	// Cari data post SEBELUM dihapus untuk mendapatkan info UserID, PostType, BookID, dan ImgURL
	var post models.Post
	if err := s.db.Where("public_id = ? AND user_id = ?", publicID, userID).First(&post).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Menyesuaikan dengan pesan error di handler Anda: "post not found or you're not authorized"
			return errors.New("post not found or you're not authorized")
		}
		return err
	}

	// Ambil daftar kategori yang menempel pada post (untuk update usage_count nanti)
	categoryIDs, err := s.postRepo.GetPostCategories(post.PostID)
	if err != nil {
		return err
	}

	// Transaksi Database
	err = s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.postRepo.WithTx(tx)
		txUserRepo := s.userRepo.WithTx(tx)
		txBookRepo := s.bookshelfRepo.WithTx(tx)

		// Hapus Post (Soft Delete)
		if err := txRepo.DeletePostWithTx(tx, post.PostID, userID); err != nil {
			return err
		}

		// Bersihkan relasi kategori
		if err := txRepo.ClearPostCategories(tx, post.PostID); err != nil {
			return err
		}

		// Kurangi usage_count kategori terkait
		if err := txRepo.DecrementCategoryUsage(tx, categoryIDs); err != nil {
			return err
		}

		// --- SYNC SKOR ---
		// SYNC SKOR USER: total_posts - 1 dan hitung ulang Hot Score User
		if err := txUserRepo.SyncUserStats(tx, userID, "total_posts", -1); err != nil {
			return err
		}

		// SYNC SKOR BUKU: Jika yang dihapus adalah Review, kurangi total_reviews di tabel book_stats
		if post.PostType == "review" && post.BookID > 0 {
			if err := txBookRepo.SyncBookStats(tx, post.BookID, "total_reviews", -1); err != nil {
				return err
			}
		}

		return nil
	})

	// Jika transaksi database gagal, kembalikan error dan batalkan penghapusan gambar di Cloudinary
	if err != nil {
		return err
	}

	// PENGHAPUSAN GAMBAR ANALYSIS DI CLOUDINARY
	if post.PostType == "analysis" && post.ImgURL != "" {
		_ = utils.DeleteFromCloudinary(post.ImgURL)
	}

	return nil
}

func (s *postService) GetUserPosts(viewerID *uint, targetUsername string, page, limit int) ([]dto.PostSummaryDTO, *dto.PaginationDTO, error) {
	// GANTI fungsi lokal dengan fungsi GLOBAL utils
	targetUser, hasAccess, err := utils.HasProfileAccess(s.userRepo, viewerID, targetUsername)
	if err != nil {
		return nil, nil, err
	}

	// Jika profil privat dan viewer tidak punya akses (bukan follower/owner)
	if !hasAccess {
		return []dto.PostSummaryDTO{}, dto.NewPaginationDTO(0, page, limit), nil
	}

	// Ambil data dari repo
	var vID uint
	if viewerID != nil {
		vID = *viewerID // Ambil ID jika user login
	}

	// Masukkan vID sebagai argumen pertama
	posts, total, err := s.postRepo.GetPostsByUserID(vID, targetUser.UserID, page, limit)
	if err != nil {
		return nil, nil, err
	}

	return s.mapPostsToSummaryDTOs(posts), dto.NewPaginationDTO(total, page, limit), nil
}

// 2. GET USER LIKED POSTS (HANYA PEMILIK)
func (s *postService) GetUserLikedPosts(viewerID *uint, targetUsername string, page, limit int) ([]dto.PostSummaryDTO, *dto.PaginationDTO, error) {
	// Cari user target dulu
	targetUser, err := s.userRepo.FindByUsername(targetUsername)
	if err != nil {
		return nil, nil, err
	}

	// ATURAN KHUSUS: Hanya pemilik (viewerID == targetUser.UserID) yang boleh lihat
	if viewerID == nil || *viewerID != targetUser.UserID {
		// Kembalikan array kosong seolah-olah tidak ada data (demi keamanan)
		return []dto.PostSummaryDTO{}, dto.NewPaginationDTO(0, page, limit), nil
	}

	vID := *viewerID

	// Panggil repo dengan vID
	posts, total, err := s.postRepo.GetLikedPostsByUserID(vID, targetUser.UserID, page, limit)
	if err != nil { return nil, nil, err }


	// 1. Panggil helper mapping yang sudah ada
	dtos := s.mapPostsToSummaryDTOs(posts)

	return dtos, dto.NewPaginationDTO(total, page, limit), nil
}


func (s *postService) GetUserSavedPosts(viewerID *uint, targetUsername string, page, limit int) ([]dto.PostSummaryDTO, *dto.PaginationDTO, error) {
	targetUser, err := s.userRepo.FindByUsername(targetUsername)
	if err != nil { return nil, nil, err }

	if viewerID == nil || *viewerID != targetUser.UserID {
		return []dto.PostSummaryDTO{}, dto.NewPaginationDTO(0, page, limit), nil
	}

	vID := *viewerID

	posts, total, err := s.postRepo.GetSavedPostsByUserID(vID, targetUser.UserID, page, limit)
	if err != nil { return nil, nil, err }

	return s.mapPostsToSummaryDTOs(posts), dto.NewPaginationDTO(total, page, limit), nil
}


// mapPostsToSummaryDTOs adalah helper untuk mengubah slice model Post ke slice DTO.
func (s *postService) mapPostsToSummaryDTOs(posts []models.Post) []dto.PostSummaryDTO {
	dtos := make([]dto.PostSummaryDTO, 0, len(posts))
	for _, post := range posts {
		rating := float32(post.Rating)
		publishedAt := post.PublishedAt
		displayName := post.User.Profile.DisplayName
		if displayName == "" {
			displayName = post.User.Username
		}

		postDTO := dto.PostSummaryDTO{
			PublicID:    post.PublicID.String(),
			Description: post.Description,
			ImgURL:      post.ImgURL,
			PostType:    post.PostType,
			Rating:      &rating,
			PublishedAt: &publishedAt,
			Stats:       dto.PostStatsDTO{},
			IsLiked:     post.IsLiked, // Ambil hasil subquery dari DB
			IsSaved:     post.IsSaved, // Ambil hasil subquery dari DB
			User: dto.PostUserDTO{
				Username:    post.User.Username,
				DisplayName: displayName,
				AvatarURL:   post.User.Profile.AvatarUrl,
			},
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
				PublicID:    post.Book.PublicID.String(),
				Title:       post.Book.Title,
				CoverImgURL: post.Book.CoverImgURL,
				Authors:     authorNames,
			}
		}
		dtos = append(dtos, postDTO)
	}
	return dtos
}

func (s *postService) ToggleLike(postID uint, userID uint) (bool, error) {
	var isLiked bool

	err := s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.postRepo.WithTx(tx)

		// A. Cek status like saat ini
		alreadyLiked, err := txRepo.IsLiked(postID, userID)
		if err != nil {
			return err
		}

		if alreadyLiked {
			// B. UNLIKE: Hapus baris & Sync skor (-1)
			if err := txRepo.DeleteLike(tx, postID, userID); err != nil {
				return err
			}
			isLiked = false
			return txRepo.SyncPostStats(tx, postID, "like_count", -1)
		} else {
			// C. LIKE: Tambah baris & Sync skor (+1)
			if err := txRepo.AddLike(tx, postID, userID); err != nil {
				return err
			}
			isLiked = true
			return txRepo.SyncPostStats(tx, postID, "like_count", 1)
		}
	})

	if err == nil {
		go func() {
			post, errFind := s.postRepo.FindPostByID(postID)
			if errFind != nil || post == nil { return }

			if isLiked {
				// Jika LIKE: Panggil Send
				s.notifService.Send(post.UserID, userID, "POST_LIKE", "posts", postID)
			} else {
				// Jika UNLIKE: Panggil Remove
				s.notifService.Remove(post.UserID, userID, "POST_LIKE", "posts", postID, 1)
			}
		}()
	}


	return isLiked, err
}

func (s *postService) ToggleSave(userID uint, postID uint) (bool, error) {
	var isSaved bool

	err := s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.postRepo.WithTx(tx)

		// A. Cek status save saat ini
		alreadySaved, err := txRepo.IsSaved(postID, userID)
		if err != nil {
			return err
		}

		if alreadySaved {
			// B. UNSAVE: Hapus baris & Sync skor (-1)
			if err := txRepo.DeleteSave(tx, postID, userID); err != nil {
				return err
			}
			isSaved = false
			return txRepo.SyncPostStats(tx, postID, "save_count", -1)
		} else {
			// C. SAVE: Tambah baris & Sync skor (+1)
			if err := txRepo.AddSave(tx, postID, userID); err != nil {
				return err
			}
			isSaved = true
			return txRepo.SyncPostStats(tx, postID, "save_count", 1)
		}
	})

	if err == nil {
		go func() {
			post, errFind := s.postRepo.FindPostByID(postID)
			if errFind != nil || post == nil { return }

			if isSaved {
				s.notifService.Send(post.UserID, userID, "POST_SAVE", "posts", postID)
			} else {
				s.notifService.Remove(post.UserID, userID, "POST_SAVE", "posts", postID, 1)
			}
		}()
	}
	return isSaved, err
}

func (s *postService) GetComments(postID uint, userID uint) ([]dto.CommentResponse, error) {
    flatComments, err := s.postRepo.GetCommentsByPostID(postID, userID)
    if err != nil {
        return nil, err
    }

    commentMap := make(map[uint]*dto.CommentResponse)
    for i := range flatComments {
        resp := mapper.ToSingleCommentResponse(flatComments[i], userID)
        commentMap[resp.ID] = &resp
    }

    for i := len(flatComments) - 1; i >= 0; i-- {
        c := flatComments[i]
        node := commentMap[c.PostCommentID]

        if c.ParentCommentID != nil {
            if parent, ok := commentMap[*c.ParentCommentID]; ok {
                parent.Replies = append([]dto.CommentResponse{*node}, parent.Replies...)
            }
        }
    }

    var finalResult []dto.CommentResponse
    for i := range flatComments {
        if flatComments[i].ParentCommentID == nil {
            finalResult = append(finalResult, *commentMap[flatComments[i].PostCommentID])
        }
    }

    return finalResult, nil
}