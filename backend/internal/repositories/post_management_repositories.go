package repositories

import (
	"context"
	"fmt"
	"math"
	"time"

	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"github.com/google/uuid"

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

type postManagementRow struct {
	PostID        uint
	PublicID      uuid.UUID
	Description   string
	PostType      string
	Rating        float64
	ImgURL        string
	PublishStatus string
	CreatedAt     time.Time
	DeletedAt     gorm.DeletedAt

	Username     string
	BookTitle    string
	LikeCount    int
	CommentCount int
}

func NewPostManagementRepository(db *gorm.DB) PostManagementRepository {
	return &postManagementRepository{db: db}
}

func (r *postManagementRepository) GetPaginatedPosts(
	ctx context.Context,
	params dto.PostQueryParams,
) (dto.PaginatedPostAPIResponse, error) {

	var resp dto.PaginatedPostAPIResponse
	var rows []postManagementRow
	var totalRows int64

	if params.Page <= 0 {
		params.Page = 1
	}

	if params.Limit <= 0 {
		params.Limit = 10
	}

	offset := (params.Page - 1) * params.Limit

	query := r.db.
		WithContext(ctx).
		Model(&models.Post{}).
		Unscoped().
		Select(`
			posts.post_id,
			posts.public_id,
			posts.description,
			posts.post_type,
			posts.rating,
			posts.img_url,
			posts.publish_status,
			posts.created_at,
			posts.deleted_at,

			users.username,

			books.title AS book_title,

			COALESCE(post_stats.like_count, 0) AS like_count,
			COALESCE(post_stats.comment_count, 0) AS comment_count
		`).
		Joins(`
			LEFT JOIN users
			ON users.user_id = posts.user_id
		`).
		Joins(`
			LEFT JOIN books
			ON books.book_id = posts.book_id
		`).
		Joins(`
			LEFT JOIN post_stats
			ON post_stats.post_id = posts.post_id
		`).
		Where("posts.publish_status != ?", "draft")

	// Filter status
	if params.PublishStatus != "" {

		if params.PublishStatus == "soft_deleted" {

			query = query.Where("posts.deleted_at IS NOT NULL")

		} else {

			query = query.Where(
				"posts.publish_status = ? AND posts.deleted_at IS NULL",
				params.PublishStatus,
			)
		}
	}

	// Search
	if params.Search != "" {

		searchPattern := fmt.Sprintf("%%%s%%", params.Search)

		query = query.Where(`
			(
				posts.description ILIKE ?
				OR users.username ILIKE ?
				OR books.title ILIKE ?
			)
		`,
			searchPattern,
			searchPattern,
			searchPattern,
		)
	}

	// Count
	countQuery := r.db.
		WithContext(ctx).
		Model(&models.Post{}).
		Unscoped().
		Joins(`
			LEFT JOIN users
			ON users.user_id = posts.user_id
		`).
		Joins(`
			LEFT JOIN books
			ON books.book_id = posts.book_id
		`).
		Where("posts.publish_status != ?", "draft")

	if params.PublishStatus != "" {

		if params.PublishStatus == "soft_deleted" {

			countQuery = countQuery.Where(
				"posts.deleted_at IS NOT NULL",
			)

		} else {

			countQuery = countQuery.Where(
				"posts.publish_status = ? AND posts.deleted_at IS NULL",
				params.PublishStatus,
			)
		}
	}

	if params.Search != "" {

		searchPattern := fmt.Sprintf("%%%s%%", params.Search)

		countQuery = countQuery.Where(`
			(
				posts.description ILIKE ?
				OR users.username ILIKE ?
				OR books.title ILIKE ?
			)
		`,
			searchPattern,
			searchPattern,
			searchPattern,
		)
	}

	if err := countQuery.Count(&totalRows).Error; err != nil {
		return resp, err
	}

	// Data
	if err := query.
		Order("posts.created_at DESC").
		Offset(offset).
		Limit(params.Limit).
		Scan(&rows).Error; err != nil {

		return resp, err
	}

	listData := make([]dto.PostManageableResponse, 0, len(rows))

	for _, row := range rows {

		statusStr := row.PublishStatus

		if row.DeletedAt.Valid {
			statusStr = "soft_deleted"
		}

		listData = append(listData, dto.PostManageableResponse{
			PostID:        row.PostID,
			PublicID:      row.PublicID.String(),
			Description:   row.Description,
			PostType:      row.PostType,
			Rating:        row.Rating,
			ImgURL:        row.ImgURL,
			PublishStatus: statusStr,
			CreatedAt:     row.CreatedAt,
			Username:      row.Username,
			BookTitle:     row.BookTitle,
			LikeCount:     row.LikeCount,
			CommentCount:  row.CommentCount,
		})
	}

	resp.Data = listData
	resp.TotalRows = totalRows
	resp.Page = params.Page
	resp.Limit = params.Limit
	resp.TotalPages = int(
		math.Ceil(float64(totalRows) / float64(params.Limit)),
	)

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