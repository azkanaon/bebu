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
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
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
	// 1. Bind data form (non-file)
	var req models.RegisterRequest
	// if err := c.ShouldBind(&req); err != nil { 
	// 	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	// 	return
	// }

	req.Username = c.PostForm("username")
	req.Email = c.PostForm("email")
	req.Password = c.PostForm("password")
	req.DisplayName = c.PostForm("display_name")
	req.Bio = c.PostForm("bio")
	req.Gender = c.PostForm("gender")

	// 2. Validasi DTO yang sudah kita isi
	if err := binding.Validator.ValidateStruct(req); err != nil {
		errs, ok := err.(validator.ValidationErrors)
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": errs.Error()})
		return
	}

	// 3. Ambil file secara terpisah
	file, err := c.FormFile("avatar_url")
	if err != nil && err != http.ErrMissingFile {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file upload"})
		return
	}	


	response, err := h.authService.Register(&req, file)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrUserAlreadyExists):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()}) // 409
		case errors.Is(err, services.ErrInvalidPassword):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}) // 400
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "An unexpected error occurred"}) // 500
		}
		return
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

// internal/handlers/auth_handler.go

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req models.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := h.authService.RequestPasswordReset(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process request"})
		return
	}

	// Selalu kembalikan response sukses yang generik untuk keamanan
	c.JSON(http.StatusOK, gin.H{
		"message": "If an account with that email exists, a password reset code has been sent.",
	})
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req models.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	err := h.authService.ResetPassword(&req)
	if err != nil {
		if errors.Is(err, services.ErrInvalidResetToken) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password has been reset successfully."})
}