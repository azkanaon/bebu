package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/repositories"
	"backend-bebu/pkg/utils"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type GamificationService interface {
	GetBadgeList(viewerID *uint, username string, page, limit int) ([]dto.BadgeDTO, *dto.PaginationDTO, error)
	GetAchievementList(viewerID *uint, username string, page, limit int) ([]dto.AchievementDTO, *dto.PaginationDTO, error)
	UpdateFavoriteBadges(userID uint, req []dto.UpdateFavoriteItemDTO) error
	UpdateFavoriteAchievements(userID uint, req []dto.UpdateFavoriteItemDTO) error
}

type gamificationService struct {
	db               *gorm.DB
	gamificationRepo repositories.GamificationRepository
	userRepo         repositories.UserRepository // Tambahkan ini untuk cek akses
}

func NewGamificationService(db *gorm.DB, gRepo repositories.GamificationRepository, uRepo repositories.UserRepository) GamificationService {
	return &gamificationService{
		db:               db,
		gamificationRepo: gRepo,
		userRepo:         uRepo,
	}
}

func (s *gamificationService) GetBadgeList(viewerID *uint, username string, page, limit int) ([]dto.BadgeDTO, *dto.PaginationDTO, error) {
	targetUser, hasAccess, err := utils.HasProfileAccess(s.userRepo, viewerID, username)
	if err != nil || !hasAccess {
		return []dto.BadgeDTO{}, dto.NewPaginationDTO(0, page, limit), err
	}

	userBadges, total, err := s.gamificationRepo.GetUserBadges(targetUser.UserID, page, limit)
	if err != nil {
		return nil, nil, err
	}

	dtos := make([]dto.BadgeDTO, 0, len(userBadges))
	for _, ub := range userBadges {
		item := dto.BadgeDTO{
			BadgeName:    ub.Badge.BadgeName,
			DisplayOrder: ub.DisplayOrder, // Langsung assign pointer ke pointer
			BadgeID: 	ub.BadgeID, 
		}

		// Pengecekan aman untuk pointer string agar tidak crash
		if ub.Badge.LogoURL != nil {
			item.LogoURL = *ub.Badge.LogoURL
		}
		if ub.Badge.Description != nil {
			item.Description = *ub.Badge.Description
		}

		dtos = append(dtos, item)
	}

	return dtos, dto.NewPaginationDTO(total, page, limit), nil
}

func (s *gamificationService) GetAchievementList(viewerID *uint, username string, page, limit int) ([]dto.AchievementDTO, *dto.PaginationDTO, error) {
	targetUser, hasAccess, err := utils.HasProfileAccess(s.userRepo, viewerID, username)
	if err != nil || !hasAccess {
		return []dto.AchievementDTO{}, dto.NewPaginationDTO(0, page, limit), err
	}

	userAchievements, total, err := s.gamificationRepo.GetUserAchievements(targetUser.UserID, page, limit)
	if err != nil {
		return nil, nil, err
	}

	dtos := make([]dto.AchievementDTO, 0, len(userAchievements))
	for _, ua := range userAchievements {
		item := dto.AchievementDTO{
			AchievementID:   ua.AchievementID,
			AchievementName: ua.Achievement.AchievementName,
			EarnedAt:        ua.EarnedAt,
			DisplayOrder:    ua.DisplayOrder, // Langsung assign pointer
		}

		if ua.Achievement.LogoURL != nil {
			item.LogoURL = *ua.Achievement.LogoURL
		}
		if ua.Achievement.Description != nil {
			item.Description = *ua.Achievement.Description
		}

		dtos = append(dtos, item)
	}

	return dtos, dto.NewPaginationDTO(total, page, limit), nil
}

func (s *gamificationService) UpdateFavoriteBadges(userID uint, req []dto.UpdateFavoriteItemDTO) error {
	if len(req) > 4 {
		return fmt.Errorf("maximum 4 favorite badges allowed")
	}

	tx := s.db.Begin()
	defer tx.Rollback()

	txRepo := s.gamificationRepo.WithTx(tx)

	// 1. Reset favorit lama
	if err := txRepo.ClearFavoriteBadges(userID); err != nil {
		return err
	}

	// 2. Pasang favorit baru
	for _, item := range req {
		if err := txRepo.SetFavoriteBadge(userID, item.ItemID, item.Order); err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
                return fmt.Errorf("you don't own badge ID %d", item.ItemID)
            }
            return fmt.Errorf("failed to set badge ID %d as favorite", item.ItemID)
		}
	}

	return tx.Commit().Error
}

func (s *gamificationService) UpdateFavoriteAchievements(userID uint, req []dto.UpdateFavoriteItemDTO) error {
	if len(req) > 4 {
		return fmt.Errorf("maximum 4 favorite achievements allowed")
	}

	tx := s.db.Begin()
	defer tx.Rollback()

	txRepo := s.gamificationRepo.WithTx(tx)

	if err := txRepo.ClearFavoriteAchievements(userID); err != nil {
		return err
	}

	for _, item := range req {
		if err := txRepo.SetFavoriteAchievement(userID, item.ItemID, item.Order); err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
                return fmt.Errorf("you don't own achievement ID %d", item.ItemID)
            }
			return fmt.Errorf("failed to set achievement ID %d as favorite", item.ItemID)
		}
	}

	return tx.Commit().Error
}