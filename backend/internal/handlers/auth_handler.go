// auth_handler.go

package handlers

import (
	// "encoding/json"
	"errors"
	"net/http"
	"backend-bebu/internal/models"
	"backend-bebu/internal/services"
	"backend-bebu/config"
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

	ipAddress := c.ClientIP()
    userAgent := c.Request.UserAgent()

    accessToken, refreshToken, responseData, err := h.authService.Login(&req, ipAddress, userAgent)

	if err != nil {
		if errors.Is(err, services.ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()}) // 401 Unauthorized
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "An unexpected error occurred"})
		return
	}

	// Set DUA cookie
    // Access Token Cookie (pendek)
    c.SetCookie("token", accessToken, config.JWTExpirationInMinutes*60, "/", "localhost", false, true)

    // Refresh Token Cookie (panjang)
    // Path-nya spesifik agar hanya dikirim ke endpoint refresh
    c.SetCookie("refresh_token", refreshToken, 3600*24*30, "/api/v1/auth", "localhost", false, true)

    c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"data":    responseData,
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	// 1. Ambil refresh token dari cookie
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token not found"})
		return
	}

	// 2. Panggil service
	newAccessToken, err := h.authService.RefreshToken(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": services.ErrInvalidRefreshToken.Error()})
		return
	}

	// 3. Set cookie access token yang baru
	accessTokenMaxAge := config.JWTExpirationInMinutes * 60
	c.SetCookie("token", newAccessToken, accessTokenMaxAge, "/", "localhost", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Token refreshed successfully"})
}