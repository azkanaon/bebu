package handlers

import (
	"net/http"
	"backend-bebu/internal/domain"
	"backend-bebu/internal/dto"
	"github.com/gin-gonic/gin"
)

type ExpHandler struct {
	service domain.ExpService
}

func NewExpHandler(r *gin.Engine, service domain.ExpService) {
	handler := &ExpHandler{service: service}
	
	// Endpoint internal atau publik yang memicu penambahan EXP
	r.POST("/api/v1/exp/reward", handler.HandleRewardExp)
}

func (h *ExpHandler) HandleRewardExp(c *gin.Context) {
	var req dto.RewardExpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// Panggil service layer
	err := h.service.RewardExp(c.Request.Context(), req.UserID, req.SourceID, req.SourceType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "EXP rewarded and leaderboard updated successfully",
	})
}