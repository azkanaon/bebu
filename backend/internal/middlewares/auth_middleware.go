package middlewares

import (
	"net/http"
	"strings"

	"github.com/google/uuid"

	// Ganti dengan path ke utilitas token Anda
	"backend-bebu/internal/repositories"
	"backend-bebu/pkg/utils"

	"github.com/gin-gonic/gin"
)

type AuthMiddleware struct {
	userRepo repositories.UserRepository // <-- TAMBAHKAN DEPENDENSI
}

func NewAuthMiddleware(userRepo repositories.UserRepository) *AuthMiddleware { // <-- TERIMA DEPENDENSI
	return &AuthMiddleware{userRepo: userRepo}
}

// RequiredAuth mewajibkan otentikasi.
func (m *AuthMiddleware) RequiredAuth() gin.HandlerFunc {
	return func(c *gin.Context) {

		tokenString, err := c.Cookie("token")
		if err != nil {
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization is required"})
				return
			}
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		}

		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		publicID, err := uuid.Parse(claims.Subject)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			return
		}
		
		user, err := m.userRepo.FindUserByPublicID(publicID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			return
		}

		c.Set("userID", user.UserID)
		
		c.Next()
	}
}

// OptionalAuth tidak mewajibkan otentikasi.
func (m *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := c.Cookie("token")
        // ... (logika mengambil token dari cookie atau header) ...

		if tokenString == "" {
			c.Next()
			return
		}

		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			c.Next()
			return
		}

		if claims != nil {
			publicID, err := uuid.Parse(claims.Subject)
			if err != nil {
				c.Next()
				return
			}
			
			// Ambil user dari DB berdasarkan PublicID
			user, err := m.userRepo.FindUserByPublicID(publicID)
			if err != nil {
				c.Next()
				return
			}

			// SUKSES! Simpan UserID (uint) ke context
			c.Set("userID", user.UserID)
		}
		
		c.Next()
	}
}