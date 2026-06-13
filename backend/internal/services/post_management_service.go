package services

import (
	"context"
	"errors"

	"backend-bebu/internal/dto"
	"backend-bebu/internal/repositories"
	"backend-bebu/pkg/utils"
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

	shouldDeleteImage := false

	switch req.Status {
	case "published":
		// Catatan: Jika memang mutlak tidak ada restore, case ini bisa diabaikan/dihapus kelak.
		if post.DeletedAt.Valid {
			if err := s.repo.RestorePost(ctx, postID); err != nil {
				return errors.New("failed to restore post records from soft-deleted block")
			}
		}
		err = s.repo.UpdateStatus(ctx, postID, "published")

	case "soft_delete":
		if post.DeletedAt.Valid {
			return nil
		}
		
		// Sekarang repo SoftDeletePost juga bertanggung jawab me-hard delete relasinya
		err = s.repo.SoftDeletePost(ctx, postID)
		if err == nil {
			shouldDeleteImage = true
		}

	case "hard_delete":
		if !post.DeletedAt.Valid {
			shouldDeleteImage = true
		}

		// Hard delete total (Post & Relasi)
		err = s.repo.HardDeletePost(ctx, postID)

	default:
		return errors.New("unrecognized target management status state")
	}

	if err != nil {
		return err
	}

	// PENGHAPUSAN GAMBAR DI CLOUDINARY
	if shouldDeleteImage && post.PostType == "analysis" && post.ImgURL != "" {
		_ = utils.DeleteFromCloudinary(post.ImgURL)
	}

	return nil
}