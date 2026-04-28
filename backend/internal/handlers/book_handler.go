package handlers

import (
	"net/http"

	"backend-bebu/internal/services"

	"github.com/gin-gonic/gin"
)

type BookHandler struct {
	service *services.BookService
}

func NewBookHandler(s *services.BookService) *BookHandler {
	return &BookHandler{s}
}

func (h *BookHandler) GetBooks(c *gin.Context) {
	books, err := h.service.GetBooks()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "failed to fetch books",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": books,
	})
}