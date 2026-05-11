// internal/middlewares/csrf_middleware.go
package middlewares

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func CSRFMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method
		path := c.Request.URL.Path

		if method == "GET" || method == "OPTIONS" ||
			path == "/api/v1/auth/login" || path == "/api/v1/auth/register" ||
			path == "/api/v1/auth/logout" {
			c.Next()
			return
		}

		// 1. Ambil token dari cookie (Gin sudah otomatis unescape nilai cookie)
		cookieToken, err := c.Cookie("csrf-token")
		if err != nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF cookie not found"})
			return
		}

		// 2. Ambil token dari header (Ambil nilai aslinya/RAW)
		headerToken := c.GetHeader("X-CSRF-Token")
		if headerToken == "" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF header not found"})
			return
		}

		// --- BAGIAN DEBUGGING (Hapus jika sudah lancar) ---
		// fmt.Printf("DEBUG CSRF: \nCookie: %s\nHeader: %s\n", cookieToken, headerToken)

		// 3. Bandingkan secara langsung
		if cookieToken != headerToken {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF token mismatch"})
			return
		}

		c.Next()
	}
}
