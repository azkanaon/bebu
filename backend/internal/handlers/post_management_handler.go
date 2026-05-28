package handlers

import (
	"net/http"
	"strconv"

	"backend-bebu/internal/dto"
	"backend-bebu/internal/services"

	"github.com/gin-gonic/gin"
)

type PostManagementHandler struct {
	svc services.PostManagementService
}

func NewPostManagementHandler(svc services.PostManagementService) *PostManagementHandler {
	return &PostManagementHandler{svc: svc}
}

// GetPosts mengembalikan list postingan berpaginasi untuk tabel kontrol admin
func (h *PostManagementHandler) GetPosts(c *gin.Context) {
	var params dto.PostQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter query filters"})
		return
	}

	resp, err := h.svc.GetPostList(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// UpdatePostStatus mengubah status penayangan atau menghapus postingan secara permanen/sementara
func (h *PostManagementHandler) UpdatePostStatus(c *gin.Context) {
	idParam := c.Param("id")
	postID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Required param post identification missing or invalid"})
		return
	}

	var req dto.UpdatePostStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status choice must be 'published', 'soft_delete', or 'hard_delete'"})
		return
	}

	err = h.svc.UpdatePostStatus(c.Request.Context(), uint(postID), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Post infrastructure management executed successfully",
	})
}