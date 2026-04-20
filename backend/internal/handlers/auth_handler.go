// auth_handler.go

package handlers

import (
	// "encoding/json"
	"errors"
	"net/http"
	"backend-bebu/internal/models" // Ganti 'backend-bebu'
	"backend-bebu/internal/services"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService services.AuthService
}

// NewAuthHandler adalah constructor
func NewAuthHandler(authService services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Register adalah handler untuk endpoint pendaftaran yang disesuaikan untuk Gin
func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest

	// 1. Bind body request JSON ke struct. Gin membuat ini lebih mudah.
	// ShouldBindJSON akan otomatis memeriksa Content-Type dan melakukan parsing.
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// 2. Panggil service (Tidak ada perubahan di sini)
	response, err := h.authService.Register(&req)
	if err != nil {
		// Cek jenis error dari service
		if errors.Is(err, services.ErrUserAlreadyExists) {
			// Mengirim response error dengan Gin
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}

		if errors.Is(err, services.ErrInvalidPassword) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Untuk error lainnya
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	// 3. Kirim response sukses dengan Gin
	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"data":    response,
	})
}