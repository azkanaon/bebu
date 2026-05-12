package handlers

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/mapper"
	"backend-bebu/internal/services"
	"net/http"
	"github.com/gin-gonic/gin"

	"strconv"
)

type CommentHandler struct {
	service services.CommentService
}

func NewCommentHandler(service services.CommentService) *CommentHandler {
	return &CommentHandler{service}
}

func (h *CommentHandler) CreateComment(c *gin.Context) {
	var req dto.CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ambil userID dari context (setelah melewati middleware Auth)
	userID := c.MustGet("userID").(uint)

	comment, err := h.service.AddComment(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Gunakan mapper yang sudah kita buat sebelumnya untuk menyeragamkan format
	response := mapper.ToCommentResponse(*comment, userID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Komentar berhasil ditambahkan",
		"data":    response,
	})
}

func (h *CommentHandler) ToggleLike(c *gin.Context) {
	// Ambil ID dari URL: /comments/:id/like
	commentIDStr := c.Param("id")
	commentID, _ := strconv.ParseUint(commentIDStr, 10, 32)
	
	userID := c.MustGet("userID").(uint)

	isLiked, err := h.service.ToggleLike(userID, uint(commentID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses like"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"liked": isLiked,
		"message": "Berhasil memperbarui like",
	})
}

func (h *CommentHandler) DeleteComment(c *gin.Context) {
    commentID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
    userID := c.MustGet("userID").(uint)
    
    // Ambil post_id
    postID, _ := strconv.ParseUint(c.Query("post_id"), 10, 32)

    if postID == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "post_id diperlukan untuk update statistik"})
        return
    }

    // UBAH: Minta service mengembalikan jumlah total yang dihapus
    deletedCount, err := h.service.SoftDeleteComment(uint(commentID), userID, uint(postID))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Komentar dan balasannya berhasil dihapus",
        "deleted_count": deletedCount,
    })
}