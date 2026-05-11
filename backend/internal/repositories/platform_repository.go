package repositories

import (
	"backend-bebu/internal/models"

	"gorm.io/gorm"
)

type PlatformRepository interface {
	GetAllPlatforms() ([]models.Platform, error)
}

type platformRepository struct {
	db *gorm.DB
}

func NewPlatformRepository(db *gorm.DB) PlatformRepository {
	return &platformRepository{db: db}
}

func (r *platformRepository) GetAllPlatforms() ([]models.Platform, error) {
	var platforms []models.Platform
	err := r.db.Order("platform_name ASC").Find(&platforms).Error
	return platforms, err
}