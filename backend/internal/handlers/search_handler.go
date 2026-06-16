package handlers

import (
	"backend-bebu/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type SearchHandler struct {
	service services.SearchService
}

func NewSearchHandler(s services.SearchService) *SearchHandler {
	return &SearchHandler{service: s}
}

// 1. GET /api/v1/search/top?q=...
func (h *SearchHandler) SearchTop(c *gin.Context) {
	query := c.Query("q")
	
	// Ambil viewerID dari context (OptionalAuth)
	var viewerID *uint
	if id, exists := c.Get("userID"); exists {
		uid := id.(uint)
		viewerID = &uid
	}

	result, err := h.service.SearchTop(viewerID, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch top search results"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": result})
}

// 2. GET /api/v1/search/books?q=...&page=1&limit=20
func (h *SearchHandler) SearchBooks(c *gin.Context) {
	query := c.Query("q")
	
	// Parsing Paginasi
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 { page = 1 }
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 { limit = 20 }

	// Panggil Service
	books, pagination, err := h.service.SearchBooks(query, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to search books"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": books,
		"meta": pagination,
	})
}

// 3. GET /api/v1/search/posts?q=...&page=1&limit=20
func (h *SearchHandler) SearchPosts(c *gin.Context) {
	query := c.Query("q")
	
	// Parsing Paginasi
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 { page = 1 }
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 { limit = 20 }

	// Panggil Service
	posts, pagination, err := h.service.SearchPosts(query, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to search posts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": posts,
		"meta": pagination,
	})
}

// 4. GET /api/v1/search/users?q=...&page=1&limit=20
// (Dahulu sudah dibahas, saya sertakan agar lengkap)
func (h *SearchHandler) SearchUsers(c *gin.Context) {
	query := c.Query("q")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 { page = 1 }
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	
	var viewerID *uint
	if id, exists := c.Get("userID"); exists {
		uid := id.(uint)
		viewerID = &uid
	}

	users, pagination, err := h.service.SearchUsers(viewerID, query, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to search users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": users,
		"meta": pagination,
	})
}

func (h *SearchHandler) GetHistory(c *gin.Context) {
	userID, _ := c.Get("userID") // Wajib login
	
	history, err := h.service.GetMySearchHistory(userID.(uint))
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to fetch history"})
		return
	}
	c.JSON(200, gin.H{"data": history})
}

func (h *SearchHandler) DeleteHistory(c *gin.Context) {
	// 1. Ambil userID dengan cara yang aman (Check exists & cast ok)
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, ok := userIDValue.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID in context"})
		return
	}

	// 2. Ambil ID riwayat dari parameter URL
	logIDStr := c.Param("id")
	logID, err := strconv.ParseUint(logIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid history ID format"})
		return
	}

	// 3. Panggil Service
	err = h.service.DeleteHistoryItem(userID, uint(logID))
	if err != nil {
		if err.Error() == "record not found" { // Sesuaikan dengan error dari repo/gorm
			c.JSON(http.StatusNotFound, gin.H{"error": "history item not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "history item deleted"})
}

// ClearAllHistory menghapus seluruh riwayat user
func (h *SearchHandler) ClearAllHistory(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, ok := userIDValue.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	if err := h.service.ClearAllHistory(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to clear history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "all search history cleared"})
}

func (h *SearchHandler) SearchAuthors(c *gin.Context) {
	query := c.Query("q")
	authors, err := h.service.SearchAuthors(query)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"data": authors})
}

func (h *SearchHandler) SearchGenres(c *gin.Context) {
	query := c.Query("q")
	genres, err := h.service.SearchGenres(query)
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to search genres"})
		return
	}
	c.JSON(200, gin.H{"data": genres})
}

func (h *SearchHandler) SearchChatConversations(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, ok := userIDValue.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
		return
	}
	query := c.Query("q")

	results, err := h.service.SearchChatConversations(userID, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to search conversations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": results})
}

func (h *SearchHandler) SearchChatMessages(c *gin.Context) {
	userIDValue, _ := c.Get("userID")
	userID := userIDValue.(uint)
	query := c.Query("q")
	
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	results, pagination, err := h.service.SearchChatMessages(userID, query, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to search messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": results,
		"meta": pagination,
	})
}

func (h *SearchHandler) SearchInConversation(c *gin.Context) {
	userIDValue, _ := c.Get("userID")
	userID := userIDValue.(uint)

	// Ambil ID ruangan dari URL
	convID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	query := c.Query("q")
	
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	results, pagination, err := h.service.SearchMessagesInConversation(userID, uint(convID), query, page, limit)
	if err != nil {
		if err.Error() == "forbidden: you are not a member of this conversation" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to search in conversation"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": results,
		"meta": pagination,
	})
}