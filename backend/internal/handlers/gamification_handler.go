package handlers

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// UserHandler adalah struct yang akan menampung semua method handler terkait user.
// Dia butuh UserService untuk bekerja.
type GamificationHandler struct {
	gamificationService services.GamificationService
}

// NewUserHandler adalah "pabrik" untuk membuat UserHandler baru.
func NewGamificationHandler(gamificationService services.GamificationService) *GamificationHandler {
	return &GamificationHandler{
		gamificationService: gamificationService,
	}
}

func (h *GamificationHandler) GetUserBadges(c *gin.Context) {
	username := c.Param("username")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	
	var viewerID *uint
	if id, exists := c.Get("userID"); exists {
		if castedID, ok := id.(uint); ok {
			viewerID = &castedID
		}
	}

	// Sekarang h.gamificationService sudah dikenal
	badges, pagination, err := h.gamificationService.GetBadgeList(viewerID, username, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch badges"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": badges, "meta": pagination})
}

func (h *GamificationHandler) GetUserAchievements(c *gin.Context) {
    username := c.Param("username")
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    
    var viewerID *uint
    if id, exists := c.Get("userID"); exists {
        if castedID, ok := id.(uint); ok {
            viewerID = &castedID
        }
    }

    achievements, pagination, err := h.gamificationService.GetAchievementList(viewerID, username, page, limit)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch achievements"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"data": achievements, "meta": pagination})
}

func (h *GamificationHandler) UpdateFavoriteBadges(c *gin.Context) {
	// Ambil userID dengan cara yang aman
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := userIDValue.(uint)

	var req []dto.UpdateFavoriteItemDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.gamificationService.UpdateFavoriteBadges(userID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Favorite badges updated successfully"})
}

func (h *GamificationHandler) UpdateFavoriteAchievements(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := userIDValue.(uint)

	var req []dto.UpdateFavoriteItemDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.gamificationService.UpdateFavoriteAchievements(userID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Favorite achievements updated successfully"})
}