package services

import (
	"context"
	"math"
	"fmt"
	"backend-bebu/internal/dto"
	"backend-bebu/internal/repositories"
	"backend-bebu/pkg/utils"
)

type UserManagementService interface {
	GetAllUsers(ctx context.Context, filters dto.UserManagementFilterRequest) (*dto.PaginatedUserResponse, error)
	ModerateUserStatus(ctx context.Context, userID uint, status string) error
}

type userManagementService struct {
	repo repositories.UserManagementRepository
}

func NewUserManagementService(repo repositories.UserManagementRepository) UserManagementService {
	return &userManagementService{repo: repo}
}

func (s *userManagementService) GetAllUsers(ctx context.Context, filters dto.UserManagementFilterRequest) (*dto.PaginatedUserResponse, error) {
	results, totalCount, err := s.repo.FetchManageableUsers(filters)
	if err != nil {
		return nil, err
	}

	limit := 10
	if filters.Limit > 0 {
		limit = filters.Limit
	}
	page := 1
	if filters.Page > 0 {
		page = filters.Page
	}

	totalPages := int(math.Ceil(float64(totalCount) / float64(limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	return &dto.PaginatedUserResponse{
		Data:        results,
		TotalCount:  totalCount,
		CurrentPage: page,
		TotalPages:  totalPages,
	}, nil
}

func (s *userManagementService) ModerateUserStatus(ctx context.Context, userID uint, status string) error {
	var avatarToDelete string

	// Cek apakah status transisinya adalah "banned" (Ban Permanent)
	if status == "banned" {
		// Ambil data profil untuk melihat apakah user memiliki foto avatar
		profile, err := s.repo.FindUserProfileByID(ctx, userID)
		if err == nil && profile != nil && profile.AvatarUrl != "" {
			avatarToDelete = profile.AvatarUrl
		}
	}

	// Pembaruan status user di database
	if err := s.repo.UpdateUserStatus(ctx, userID, status); err != nil {
		return fmt.Errorf("failed to update user management status: %w", err)
	}

	// Hanya dieksekusi jika database sukses di-update dan user memiliki avatar
	if avatarToDelete != "" {
		// Panggil helper utilitas reusable Anda
		_ = utils.DeleteFromCloudinary(avatarToDelete)
	}

	return nil
}