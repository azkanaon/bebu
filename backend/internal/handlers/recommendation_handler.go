package handlers

import (
	"net/http"
	"backend-bebu/internal/services"
	"github.com/gin-gonic/gin"
)

type RecommendationHandler struct {
	service services.RecommendationService
}

func NewRecommendationHandler(service services.RecommendationService) *RecommendationHandler {
	return &RecommendationHandler{service}
}

func (h *RecommendationHandler) GetFriendRecommendations(c *gin.Context) {
	// Ambil userID dari Login Context Middleware secara dinamis & aman
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak terautentikasi"})
		return
	}

	userID, ok := userIDValue.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Format format user ID salah"})
		return
	}

	recommendations, err := h.service.GetFriendRecommendations(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, recommendations)
}