package handlers

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/services"
	"net/http"
	"strconv"

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
		if err.Error() == "you cannot send a message to yourself" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to send message"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": res})
}

func (h *ChatHandler) GetInbox(c *gin.Context) {
	// Ambil userID dengan pola aman
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDValue.(uint)

	// Parsing parameter paginasi
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 { page = 1 }
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "15"))
	if limit < 1 { limit = 15 }

	// Panggil service
	inbox, pagination, err := h.service.GetInbox(userID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch inbox"})
		return
	}

	// Response dengan data dan meta
	c.JSON(http.StatusOK, gin.H{
		"data": inbox,
		"meta": pagination,
	})
}

func (h *ChatHandler) GetMessages(c *gin.Context) {
	userIDValue, _ := c.Get("userID")
	userID := userIDValue.(uint)

	// Parse Conversation ID
	convID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid conversation ID"})
		return
	}

	// Parse Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	messages, pagination, err := h.service.GetMessages(userID, uint(convID), page, limit)
	if err != nil {
		if err.Error() == "forbidden: you are not a member of this conversation" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": messages,
		"meta": pagination,
	})
}

func (h *ChatHandler) MarkAsRead(c *gin.Context) {
	userIDValue, _ := c.Get("userID")
	userID := userIDValue.(uint)

	convID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	err := h.service.MarkAsRead(userID, uint(convID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to mark as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "conversation marked as read"})
}

func (h *ChatHandler) CreateGroup(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req dto.CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	res, err := h.service.CreateGroup(userID.(uint), req)
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to create group"})
		return
	}
	c.JSON(201, gin.H{"data": res})
}

func (h *ChatHandler) AddMembers(c *gin.Context) {
	adminID, _ := c.Get("userID")
	convID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var req dto.AddMembersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.AddMembers(adminID.(uint), uint(convID), req.MemberIDs); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Members added successfully"})
}

func (h *ChatHandler) RenameGroup(c *gin.Context) {
	adminID, _ := c.Get("userID")
	convID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var req dto.RenameGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.RenameGroup(adminID.(uint), uint(convID), req.Title); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Group renamed successfully"})
}

func (h *ChatHandler) LeaveGroup(c *gin.Context) {
	userIDValue, _ := c.Get("userID")
	userID := userIDValue.(uint)
	convID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	if err := h.service.LeaveGroup(userID, uint(convID)); err != nil {
		c.JSON(500, gin.H{"error": "failed to leave group"})
		return
	}
	c.JSON(200, gin.H{"message": "You have left the group"})
}

// DELETE /api/v1/chats/conversations/:id/members/:userId
func (h *ChatHandler) KickMember(c *gin.Context) {
	adminIDValue, _ := c.Get("userID")
	adminID := adminIDValue.(uint)
	
	convID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	targetUserID, _ := strconv.ParseUint(c.Param("userId"), 10, 32)

	if err := h.service.KickMember(adminID, uint(convID), uint(targetUserID)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Member kicked successfully"})
}