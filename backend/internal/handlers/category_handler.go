package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"backend-bebu/config"
	"backend-bebu/internal/models"

	"strconv"
)

type CategoryResponse struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Count int    `json:"count"`
}

func GetUserCategories(c *gin.Context) {
	userID := uint(1)

	var categories []models.Category

	err := config.DB.
		Joins("JOIN user_categories uc ON uc.category_id = categories.category_id").
		Where("uc.user_id = ?", userID).
		Order("categories.usage_count DESC").
		Limit(10).
		Find(&categories).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// 🔥 IMPORTANT: initialize slice
	response := make([]CategoryResponse, 0)

	for _, cat := range categories {
		response = append(response, CategoryResponse{
			ID:   cat.CategoryID,
			Name: cat.CategoryName,
		})
	}

	c.JSON(http.StatusOK, response)
}

func GetAllCategories(c *gin.Context) {
	userID := uint(1)

	var categories []models.Category
	config.DB.Find(&categories)

	var result []gin.H

	for _, cat := range categories {
		var count int64

		config.DB.Model(&models.UserCategory{}).
			Where("user_id = ? AND category_id = ?", userID, cat.CategoryID).
			Count(&count)

		result = append(result, gin.H{
			"id":           cat.CategoryID,
			"name":         cat.CategoryName,
			"is_favorited": count > 0,
		})
	}

	c.JSON(http.StatusOK, result)
}

func FavoriteCategory(c *gin.Context) {
	userID := uint(1)

	categoryIDParam := c.Param("id")
	categoryIDUint64, err := strconv.ParseUint(categoryIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}
	categoryID := uint(categoryIDUint64)

	// 🔥 Cek jumlah kategori
	var count int64
	config.DB.Model(&models.UserCategory{}).
		Where("user_id = ?", userID).
		Count(&count)

	if count >= 10 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Maximum 10 categories allowed",
		})
		return
	}

	// 🔥 Prevent duplicate
	var existing models.UserCategory
	err = config.DB.
		Where("user_id = ? AND category_id = ?", userID, categoryID).
		First(&existing).Error

	if err == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Already favorited",
		})
		return
	}

	config.DB.Create(&models.UserCategory{
		UserID:     userID,
		CategoryID: categoryID,
	})

	c.Status(http.StatusOK)
}

func UnfavoriteCategory(c *gin.Context) {
	userID := uint(1)
	categoryIDParam := c.Param("id")

	config.DB.
		Where("user_id = ? AND category_id = ?", userID, categoryIDParam).
		Delete(&models.UserCategory{})

	c.Status(http.StatusOK)
}