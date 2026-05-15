package repositories

import (
	"backend-bebu/internal/models"
	"strings"
	"backend-bebu/internal/dto"
	"gorm.io/gorm"
)

type CategoryRepository interface {
	GetUserFavoriteCategories(userID uint) ([]models.Category, error)
	GetAllCategoriesWithFavoriteStatus(userID uint) ([]dto.CategoryWithStatus, error)
	CleanEmptyFavoriteCategories(tx *gorm.DB) error
	Search(query string) ([]models.Category, error)
	CountUserCategories(userID uint) (int64, error)
	IsCategoryFavorited(userID, categoryID uint) (bool, error)
	AddFavoriteCategory(userID, categoryID uint) error
	RemoveFavoriteCategory(userID, categoryID uint) error
}

type categoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) CategoryRepository {
	return &categoryRepository{db}
}

func (r *categoryRepository) GetUserFavoriteCategories(userID uint) ([]models.Category, error) {
	var categories []models.Category

	err := r.db.
		Joins("JOIN user_categories uc ON uc.category_id = categories.category_id").
		Where("uc.user_id = ?", userID).
		Order("categories.usage_count DESC").
		Limit(10).
		Find(&categories).Error

	return categories, err
}

func (r *categoryRepository) GetAllCategoriesWithFavoriteStatus(userID uint) ([]dto.CategoryWithStatus, error) {
	var result []dto.CategoryWithStatus

	err := r.db.Table("categories").
		Select(`
			categories.category_id as id, 
			categories.category_name as name,
			(CASE WHEN uc.user_id IS NOT NULL THEN true ELSE false END) as is_favorited
		`).
		Joins("LEFT JOIN user_categories uc ON uc.category_id = categories.category_id AND uc.user_id = ?", userID).
		Where("categories.usage_count > 0").
		Order("categories.category_name ASC").
		Scan(&result).Error

	return result, err
}

func (r *categoryRepository) CleanEmptyFavoriteCategories(tx *gorm.DB) error {
    return tx.Exec(`
        DELETE FROM user_categories 
        WHERE category_id IN (
            SELECT category_id FROM categories WHERE usage_count <= 0
        )
    `).Error
}

func (r *categoryRepository) Search(query string) ([]models.Category, error) {
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

func (r *categoryRepository) CountUserCategories(userID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.UserCategory{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}

func (r *categoryRepository) IsCategoryFavorited(userID, categoryID uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.UserCategory{}).
		Where("user_id = ? AND category_id = ?", userID, categoryID).
		Count(&count).Error
	return count > 0, err
}

func (r *categoryRepository) AddFavoriteCategory(userID, categoryID uint) error {
	return r.db.Create(&models.UserCategory{
		UserID:     userID,
		CategoryID: categoryID,
	}).Error
}

func (r *categoryRepository) RemoveFavoriteCategory(userID, categoryID uint) error {
	return r.db.Where("user_id = ? AND category_id = ?", userID, categoryID).
		Delete(&models.UserCategory{}).Error
}