// internal/handlers/middleware.go
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func CSRFMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Abaikan pengecekan untuk metode yang aman (tidak mengubah data)
		method := c.Request.Method
		if method == "GET" || method == "HEAD" || method == "OPTIONS" {
			c.Next()
			return
		}

		// 1. Ambil token dari cookie
		cookieToken, err := c.Cookie("csrf-token")
		if err != nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF cookie not found"})
			return
		}

		// 2. Ambil token dari header
		headerToken := c.GetHeader("X-CSRF-Token")
		if headerToken == "" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF header not found"})
			return
		}

		// 3. Bandingkan keduanya
		if cookieToken != headerToken {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF token mismatch"})
			return
		}

		// Jika semuanya cocok, lanjutkan request
		c.Next()
	}
}