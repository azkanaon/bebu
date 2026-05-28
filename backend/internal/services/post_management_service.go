package services

import (
	"context"
	"errors"

	"backend-bebu/internal/dto"
	"backend-bebu/internal/repositories"
)

type PostManagementService interface {
	GetPostList(ctx context.Context, params dto.PostQueryParams) (dto.PaginatedPostAPIResponse, error)
	UpdatePostStatus(ctx context.Context, postID uint, req dto.UpdatePostStatusRequest) error
}

type postManagementService struct {
	repo repositories.PostManagementRepository
}

func NewPostManagementService(repo repositories.PostManagementRepository) PostManagementService {
	return &postManagementService{repo: repo}
}

func (s *postManagementService) GetPostList(ctx context.Context, params dto.PostQueryParams) (dto.PaginatedPostAPIResponse, error) {
	return s.repo.GetPaginatedPosts(ctx, params)
}

func (s *postManagementService) UpdatePostStatus(ctx context.Context, postID uint, req dto.UpdatePostStatusRequest) error {
	post, err := s.repo.FindPostByID(ctx, postID)
	if err != nil {
		return errors.New("post target not found in infrastructure records")
	}

	// Aturan Sistem Baru:
	switch req.Status {
	case "published":
		// Jika post saat ini berstatus soft_deleted, kembalikan data (restore) terlebih dahulu
		if post.DeletedAt.Valid {
			if err := s.repo.RestorePost(ctx, postID); err != nil {
				return errors.New("failed to restore post records from soft-deleted block")
			}
		}
		// Set publish_status ke "published"
		return s.repo.UpdateStatus(ctx, postID, "published")

	case "soft_delete":
		// Jika data post aslinya sudah terhapus secara soft-delete, lewatkan
		if post.DeletedAt.Valid {
			return nil
		}
		// Jalankan siklus soft delete bawaan GORM
		return s.repo.SoftDeletePost(ctx, postID)

	case "hard_delete":
		// Hapus permanen record data dari DB fisik
		return s.repo.HardDeletePost(ctx, postID)

	default:
		return errors.New("unrecognized target management status state")
	}
}