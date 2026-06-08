package handlers

import (
	"net/http"
	"strconv"
	"backend-bebu/internal/domain"
	"github.com/gin-gonic/gin"
)

type LeaderboardHandler struct {
	service domain.LeaderboardService
}

func NewLeaderboardHandler(service domain.LeaderboardService) *LeaderboardHandler {
	return &LeaderboardHandler{service: service}
}

func (h *LeaderboardHandler) GetLeaderboard(c *gin.Context) {
	// Ambil query params dengan nilai default
	periodType := c.DefaultQuery("type", "all_time") // atau "monthly"
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "5")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)

	if page < 1 { page = 1 }
	if limit < 1 || limit > 100 { limit = 5 } // Batasi maksimal limit demi keamanan server

	// EKSTRAKSI USER ID: Asumsi kamu memiliki JWT Middleware yang menyimpan userID di konteks gin
	// Misal: c.Set("userID", claims.UserID)
	var currentUserID uint
	if val, exists := c.Get("userID"); exists {
		if id, ok := val.(uint); ok {
			currentUserID = id
		}
	}

	// Jalankan service pipeline
	resp, err := h.service.GetLeaderboard(c.Request.Context(), periodType, page, limit, currentUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch leaderboard data"})
		return
	}

	c.JSON(http.StatusOK, resp)
}