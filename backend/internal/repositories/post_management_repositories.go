package repositories

import (
	"context"
	"fmt"
	"math"

	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"

	"gorm.io/gorm"
)

type PostManagementRepository interface {
	GetPaginatedPosts(ctx context.Context, params dto.PostQueryParams) (dto.PaginatedPostAPIResponse, error)
	FindPostByID(ctx context.Context, postID uint) (*models.Post, error)
	UpdateStatus(ctx context.Context, postID uint, status string) error
	SoftDeletePost(ctx context.Context, postID uint) error
	HardDeletePost(ctx context.Context, postID uint) error
	RestorePost(ctx context.Context, postID uint) error
}

type postManagementRepository struct {
	db *gorm.DB
}

func NewPostManagementRepository(db *gorm.DB) PostManagementRepository {
	return &postManagementRepository{db: db}
}

func (r *postManagementRepository) GetPaginatedPosts(ctx context.Context, params dto.PostQueryParams) (dto.PaginatedPostAPIResponse, error) {
	var resp dto.PaginatedPostAPIResponse
	var posts []models.Post
	var totalRows int64

	if params.Page <= 0 {
		params.Page = 1
	}
	if params.Limit <= 0 {
		params.Limit = 10
	}
	offset := (params.Page - 1) * params.Limit

	// Gunakan Unscoped() agar post yang berstatus 'soft_deleted' tetap bisa ditarik ke dalam list tabel admin
	query := r.db.WithContext(ctx).Model(&models.Post{}).Unscoped().
		Where("posts.publish_status != ?", "draft").
		Preload("User").
		Preload("Book").
		Preload("Stats")

	// Filter berdasarkan Status Keadaan Data
	if params.PublishStatus != "" {
		if params.PublishStatus == "soft_deleted" {
			query = query.Where("posts.deleted_at IS NOT NULL")
		} else {
			query = query.Where("posts.publish_status = ? AND posts.deleted_at IS NULL", params.PublishStatus)
		}
	}

	// Filter Global Search (Deskripsi post, username pembuat, atau judul buku)
	if params.Search != "" {
		searchPattern := fmt.Sprintf("%%%s%%", params.Search)
		query = query.Joins("LEFT JOIN users ON users.user_id = posts.user_id").
			Joins("LEFT JOIN books ON books.book_id = posts.book_id").
			Where("(posts.description ILIKE ? OR users.username ILIKE ? OR books.title ILIKE ?)", 
				searchPattern, searchPattern, searchPattern)
	}

	// Hitung Total Records
	if err := query.Count(&totalRows).Error; err != nil {
		return resp, err
	}

	// Ambil Data Berpaginasi
	if err := query.Offset(offset).Limit(params.Limit).Order("posts.created_at DESC").Find(&posts).Error; err != nil {
		return resp, err
	}

	// Mapping dari Model ke DTO Response
	listData := make([]dto.PostManageableResponse, 0)
	for _, p := range posts {
		statusStr := p.PublishStatus
		if p.DeletedAt.Valid {
			statusStr = "soft_deleted" // Override string penanda jika record sudah di-softdelete
		}

		username := "Unknown"
		if p.User != nil {
			username = p.User.Username
		}

		bookTitle := "Unknown Book"
		if p.Book != nil {
			bookTitle = p.Book.Title
		}

		likes, comments := 0, 0
		if p.Stats != nil {
			likes = p.Stats.LikeCount
			comments = p.Stats.CommentCount
		}

		listData = append(listData, dto.PostManageableResponse{
			PostID:        p.PostID,
			PublicID:      p.PublicID.String(),
			Description:   p.Description,
			PostType:      p.PostType,
			Rating:        p.Rating,
			ImgURL:        p.ImgURL,
			PublishStatus: statusStr,
			CreatedAt:     p.CreatedAt,
			Username:      username,
			BookTitle:     bookTitle,
			LikeCount:     likes,
			CommentCount:  comments,
		})
	}

	resp.Data = listData
	resp.TotalRows = totalRows
	resp.Page = params.Page
	resp.Limit = params.Limit
	resp.TotalPages = int(math.Ceil(float64(totalRows) / float64(params.Limit)))

	return resp, nil
}

func (r *postManagementRepository) FindPostByID(ctx context.Context, postID uint) (*models.Post, error) {
	var post models.Post
	// Unscoped() disertakan agar admin bisa memuat detail post yang berstatus soft_deleted
	err := r.db.WithContext(ctx).Model(&models.Post{}).Unscoped().Where("post_id = ?", postID).First(&post).Error
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *postManagementRepository) UpdateStatus(ctx context.Context, postID uint, status string) error {
	return r.db.WithContext(ctx).Model(&models.Post{}).Unscoped().
		Where("post_id = ?", postID).Update("publish_status", status).Error
}

func (r *postManagementRepository) SoftDeletePost(ctx context.Context, postID uint) error {
	// GORM secara otomatis melakukan Soft Delete jika struct memiliki field gorm.DeletedAt
	return r.db.WithContext(ctx).Where("post_id = ?", postID).Delete(&models.Post{}).Error
}

func (r *postManagementRepository) RestorePost(ctx context.Context, postID uint) error {
	// Mengembalikan post yang di-softdelete dengan mengosongkan nilai deleted_at
	return r.db.WithContext(ctx).Model(&models.Post{}).Unscoped().
		Where("post_id = ?", postID).Update("deleted_at", nil).Error
}

func (r *postManagementRepository) HardDeletePost(ctx context.Context, postID uint) error {
	// Menggunakan Unscoped().Delete() untuk menghapus baris data secara permanen dari physical table
	return r.db.WithContext(ctx).Unscoped().Where("post_id = ?", postID).Delete(&models.Post{}).Error
}