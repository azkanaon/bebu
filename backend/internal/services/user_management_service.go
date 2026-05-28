package services

import (
	"context"
	"math"
	"backend-bebu/internal/dto"
	"backend-bebu/internal/repositories"
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
	return s.repo.UpdateUserStatus(userID, status)
}