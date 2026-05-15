package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"backend-bebu/internal/services"

	"strconv"
)

type CategoryHandler struct {
	service services.CategoryService
}

func NewCategoryHandler(s services.CategoryService) *CategoryHandler {
	return &CategoryHandler{s}
}

func (h *CategoryHandler) GetUserCategories(c *gin.Context) {
	val, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := val.(uint)

	categories, err := h.service.GetUserCategories(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch user categories",
		})
		return
	}

	c.JSON(http.StatusOK, categories)
}

func (h *CategoryHandler) GetAllCategories(c *gin.Context) {
	// Ambil userID jika ada (opsional, tidak harus ada untuk list kategori umum)
	var currentUserID uint
	val, exists := c.Get("userID")
	if exists {
		currentUserID = val.(uint)
	}

	categories, err := h.service.GetAllCategories(currentUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}

	c.JSON(http.StatusOK, categories)
}

func (h *CategoryHandler) FavoriteCategory(c *gin.Context) {
	// Ambil userID dinamis
	val, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := val.(uint)

	// Ambil category ID dari param
	categoryIDParam := c.Param("id")
	categoryID, err := strconv.ParseUint(categoryIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	// Panggil Service
	err = h.service.FavoriteCategory(userID, uint(categoryID))
	if err != nil {
		// Mapping error spesifik
		switch err.Error() {
		case "maximum_limit_reached":
			c.JSON(http.StatusBadRequest, gin.H{"error": "You can only have up to 10 favorite categories"})
		case "already_favorited":
			c.JSON(http.StatusBadRequest, gin.H{"error": "This category is already in your favorites"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add favorite"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Category added to favorites"})
}

func (h *CategoryHandler) UnfavoriteCategory(c *gin.Context) {
	// Ambil userID dinamis dari middleware
	val, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := val.(uint)

	// Parse ID kategori dari URL parameter
	categoryIDParam := c.Param("id")
	categoryID, err := strconv.ParseUint(categoryIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	// Panggil Service
	err = h.service.UnfavoriteCategory(userID, uint(categoryID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove favorite category"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Category removed from favorites"})
}

func (h *CategoryHandler) Search(c *gin.Context) {
	query := c.Query("search")
	
	data, err := h.service.Search(query)
	if err != nil {
		c.JSON(500, gin.H{"message": "error"})
		return
	}

	c.JSON(200, gin.H{"data": data})
}