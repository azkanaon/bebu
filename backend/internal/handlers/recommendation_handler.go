package handlers

import (
	"net/http"

	"backend-bebu/config"
	"backend-bebu/internal/models"

	"github.com/gin-gonic/gin"
)

type RecommendationResponse struct {
	ID       uint   `json:"id"`
	Name     string `json:"name"`
	Username string `json:"username"`
	Avatar   string `json:"avatar"`
	Bio   	 string `json:"bio"`
	TotalFollowers int `json:"total_followers"`
	TotalFollowing int `json:"total_following"`
}

func GetUserRecommendations(c *gin.Context) {
	// ⚠️ sementara hardcode (nanti ambil dari auth middleware)
	currentUserID := uint(1)

	var users []models.User

	// Query ke database
	err := config.DB.
		Preload("Profile").
		Preload("Stats").
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

		if avatar == "" {
			avatar = "https://i.pravatar.cc/150"
		}

		response = append(response, RecommendationResponse{
			ID:       user.UserID,
			Name:     user.Profile.DisplayName,
			Username: user.Username,
			Avatar:   avatar,
			Bio:	  user.Profile.Bio,
			TotalFollowers: user.Stats.TotalFollowers,
			TotalFollowing: user.Stats.TotalFollowing,
		})
	}

	c.JSON(http.StatusOK, response)
}