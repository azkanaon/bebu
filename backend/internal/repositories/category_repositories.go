package repositories

import (
	"backend-bebu/internal/models"
	"strings"

	"gorm.io/gorm"
)

type CategoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) *CategoryRepository {
	return &CategoryRepository{db}
}

func (r *CategoryRepository) Search(query string) ([]models.Category, error) {
	var categories []models.Category

	db := r.db

	if query != "" {
		db = db.Where("category_normalized LIKE ?", "%"+strings.ToLower(query)+"%")
	}

	err := db.
		Order("usage_count DESC").
		Limit(10).
		Find(&categories).Error

	return categories, err
}