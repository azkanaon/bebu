package handlers

import (
	"net/http"
	"backend-bebu/internal/dto"
	"backend-bebu/internal/services"
	"github.com/gin-gonic/gin"
)

type PostShareHandler struct {
	service services.PostShareService
}

func NewPostShareHandler(service services.PostShareService) *PostShareHandler {
	return &PostShareHandler{service}
}

func (h *PostShareHandler) SharePost(c *gin.Context) {
    var req dto.ShareRequest // Nama variabelnya adalah 'req'
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
        return
    }

    userID := c.MustGet("userID").(uint)

    err := h.service.ExecuteShare(userID, req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // Gunakan 'req' sesuai dengan deklarasi di atas
    // Pastikan field di DTO kamu namanya memang 'ReceiverIDs'
    count := len(req.ReceiverIDs)

    c.JSON(http.StatusOK, gin.H{
        "message": "Postingan berhasil dibagikan ke DM",
        "count":   count,
    })
}

func (h *PostShareHandler) GetRecentRecipients(c *gin.Context) {
    // Ambil senderID dari middleware Auth (sesuaikan dengan logic jwt kamu)
    senderID := c.MustGet("userID").(uint)

    users, err := h.service.GetRecentRecipients(senderID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "status": "success",
        "data":   users,
    })
}