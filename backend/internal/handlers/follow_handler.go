package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"backend-bebu/internal/services"
)

type FollowHandler struct {
	Service *services.FollowService
}

func NewFollowHandler(s *services.FollowService) *FollowHandler {
	return &FollowHandler{s}
}

func (h *FollowHandler) ToggleFollow(c *gin.Context) {
	// 🔥 HARDCODE USER LOGIN
	userID := uint(1)

	targetIDParam := c.Param("id")
	targetID, err := strconv.Atoi(targetIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	// ❌ prevent follow diri sendiri
	if userID == uint(targetID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot follow yourself"})
		return
	}

	following, err := h.Service.ToggleFollow(userID, uint(targetID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"following": following,
	})
}