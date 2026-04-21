package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"backend-bebu/config"
	"backend-bebu/internal/models"
)

type CategoryResponse struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Count int    `json:"count"`
}

func GetUserCategories(c *gin.Context) {
	userID := 1

	var categories []models.Category

	err := config.DB.
		Joins("JOIN user_categories uc ON uc.category_id = categories.category_id").
		Where("uc.user_id = ? AND uc.deleted_at IS NULL", userID).
		Order("categories.usage_count DESC").
		Limit(8).
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