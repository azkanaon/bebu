package handlers

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ChatHandler struct {
	service services.ChatService
}

func NewChatHandler(s services.ChatService) *ChatHandler {
	return &ChatHandler{service: s}
}

func (h *ChatHandler) SendMessage(c *gin.Context) {
	userIDValue, _ := c.Get("userID")
	userID := userIDValue.(uint)

	var req dto.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.service.SendMessage(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to send message"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": res})
}