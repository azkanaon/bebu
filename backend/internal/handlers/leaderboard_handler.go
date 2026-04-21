package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"backend-bebu/config"
	"backend-bebu/internal/models"
)

type LeaderboardResponse struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	Username  string `json:"username"`
	Avatar    string `json:"avatar"`
	Rank      int    `json:"rank"`
}

func GetLeaderboard(c *gin.Context) {
	var rankings []models.UserRanking

	err := config.DB.
		Preload("User.Profile").
		Order("global_rank ASC").
		Limit(5).
		Find(&rankings).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	response := make([]LeaderboardResponse, 0)

	for _, r := range rankings {
		avatar := r.User.Profile.AvatarUrl
		if avatar == "" {
			avatar = "https://i.pravatar.cc/150"
		}

		response = append(response, LeaderboardResponse{
			ID:       r.User.UserID,
			Name:     r.User.Profile.DisplayName,
			Username: r.User.Username,
			Avatar:   avatar,
			Rank:     r.GlobalRank,
		})
	}

	c.JSON(http.StatusOK, response)
}