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

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}) // Gin akan memberikan pesan error yang jelas
		return
	}


	response, err := h.authService.Register(&req)
	if err != nil {
		// --- MULAI PERUBAHAN DI SINI ---

		// Gunakan switch case agar lebih rapi saat error bertambah
		switch {
		case errors.Is(err, services.ErrUserAlreadyExists):
			// Kasus: User sudah ada
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()}) // 409

		case errors.Is(err, services.ErrInvalidPassword):
			// Kasus: Format password tidak valid
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}) // 400

		default:
			// Kasus: Error lain yang tidak terduga
			// Sebaiknya log error ini untuk debugging
			// log.Printf("Unhandled error during registration: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "An unexpected error occurred"}) // 500
		}
		
		return // Pastikan untuk return setelah menangani error

		// --- AKHIR PERUBAHAN ---
	}
	// 3. Kirim response sukses dengan Gin
	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"data":    response,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	token, responseData, err := h.authService.Login(&req)
	if err != nil {
		if errors.Is(err, services.ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()}) // 401 Unauthorized
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "An unexpected error occurred"})
		return
	}

	// Jika login berhasil, set cookie!
	c.SetCookie("token", token, 3600*24, "/", "localhost", false, true)
    // Args: name, value, maxAge (detik), path, domain, secure, httpOnly

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"data":    responseData,
	})
}