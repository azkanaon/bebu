// internal/middlewares/csrf_middleware.go
package middlewares

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func CSRFMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Abaikan pengecekan untuk metode yang aman (tidak mengubah data)
		method := c.Request.Method
		path := c.Request.URL.Path

		// Abaikan pengecekan untuk metode aman ATAU rute Auth awal
		if method == "GET" || method == "OPTIONS" ||
			path == "/api/v1/auth/login" || path == "/api/v1/auth/register" ||
           path == "/api/v1/auth/logout" {
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
