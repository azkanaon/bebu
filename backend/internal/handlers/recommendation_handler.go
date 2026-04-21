package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"backend-bebu/config"
	"backend-bebu/internal/models"
)

type RecommendationResponse struct {
	ID       uint   `json:"id"`
	Name     string `json:"name"`
	Username string `json:"username"`
	Avatar   string `json:"avatar"`
}

func GetUserRecommendations(c *gin.Context) {
	// ⚠️ sementara hardcode (nanti ambil dari auth middleware)
	currentUserID := uint(1)

	var users []models.User

	// Query ke database
	err := config.DB.
		Preload("Profile").
		Where("user_id != ?", currentUserID). // ❌ exclude diri sendiri
		Order("RANDOM()").                    // 🎲 random biar variatif
		Limit(4).                             // ambil 4 saja
		Find(&users).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch recommendations",
		})
		return
	}

	// Mapping ke response
	var response []RecommendationResponse

	for _, user := range users {
		avatar := user.Profile.AvatarUrl

		// fallback avatar
		if avatar == "" {
			avatar = "https://i.pravatar.cc/150"
		}

		response = append(response, RecommendationResponse{
			ID:       user.UserID,
			Name:     user.Profile.DisplayName,
			Username: user.Username,
			Avatar:   avatar,
		})
	}

	c.JSON(http.StatusOK, response)
}