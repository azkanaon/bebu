package main

import (
    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"
    "backend-bebu/config"
    "backend-bebu/internal/handlers"
    "backend-bebu/internal/repositories"
	"backend-bebu/internal/services"
)

func main() {
    config.LoadAndConnectDB()
	db := config.GetDB()
    
    userRepo := repositories.NewUserRepository(db)
	authService := services.NewAuthService(userRepo)
	authHandler := handlers.NewAuthHandler(authService)

    r := gin.Default()
    r.Use(cors.Default())

    SetupRoutes(r, authHandler)

    r.Run(":8080")
}

<<<<<<< HEAD
// --> Ubah signature fungsi untuk menerima AuthHandler
func SetupRoutes(r *gin.Engine, authHandler *handlers.AuthHandler) {
	// --> Praktik yang baik: Gunakan group untuk versioning API
	v1 := r.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		{
			// --> Daftarkan route register Anda di sini
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
		}

		// --> Contoh route "me" yang dilindungi (akan butuh middleware nanti)
		users := v1.Group("/users")
		{
			users.GET("/me", handlers.GetCurrentUser)
		}
	}
=======
func SetupRoutes(r *gin.Engine) {
    api := r.Group("/api")
    {
        api.GET("/me", handlers.GetCurrentUser)
        api.GET("/users/recommendation", handlers.GetUserRecommendations)
        api.GET("/books/trending", handlers.GetTrendingBooks)
        api.GET("/categories/user", handlers.GetUserCategories)
        api.GET("/leaderboard", handlers.GetLeaderboard)
    }
>>>>>>> 4893e60 (right-navbar)
}