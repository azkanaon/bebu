package handlers

import (
	"backend-bebu/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	service services.NotificationService
}

func NewNotificationHandler(s services.NotificationService) *NotificationHandler {
	return &NotificationHandler{service: s}
}

// GET /api/v1/notifications
func (h *NotificationHandler) GetMyNotifications(c *gin.Context) {
	userIDValue, _ := c.Get("userID")
	userID := userIDValue.(uint)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	notifs, pagination, err := h.service.GetMyNotifications(userID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": notifs,
		"meta": pagination,
	})
}

// Menandai satu notifikasi sebagai sudah dibaca
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	userIDValue, _ := c.Get("userID")
	userID := userIDValue.(uint)

	notifID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	// Kita bisa panggil repo langsung atau lewat service
    // Di sini saya asumsikan Anda memanggil repository yang sudah kita buat sebelumnya
	err := h.service.MarkNotificationAsRead(userID, uint(notifID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to mark notification as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "notification marked as read"})
}

// Menandai semua notifikasi sebagai sudah dibaca
func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	userIDValue, _ := c.Get("userID")
	userID := userIDValue.(uint)

	err := h.service.MarkAllNotificationsAsRead(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to mark all notifications as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "all notifications marked as read"})
}

func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	// Ambil userID dari context (Pola Aman)
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := userIDValue.(uint)

	count, err := h.service.GetUnreadCount(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch unread count"})
		return
	}

	// Sesuai permintaan format output Anda
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"unreadCount": count,
		},
	})}