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

		users := v1.Group("/users")
		{
			users.GET("/me", handlers.GetCurrentUser)
			users.GET("/recommendation", handlers.GetUserRecommendations)
		}

		books := v1.Group("/books")
		{
			books.GET("/trending", handlers.GetTrendingBooks)
		}

		categories := v1.Group("/categories")
		{
			categories.GET("/user", handlers.GetUserCategories)
		}

		v1.GET("/leaderboard", handlers.GetLeaderboard)
	}
}