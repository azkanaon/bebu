package handlers

import (
	"backend-bebu/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type PlatformHandler struct {
	service services.PlatformService
}

func NewPlatformHandler(s services.PlatformService) *PlatformHandler {
	return &PlatformHandler{service: s}
}

func (h *PlatformHandler) GetAllPlatforms(c *gin.Context) {
	platforms, err := h.service.GetPlatforms()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch platforms"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": platforms})
}