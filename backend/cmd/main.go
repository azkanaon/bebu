package main

import (
	"time"

	"backend-bebu/config"
	"backend-bebu/internal/handlers"
	"backend-bebu/internal/middlewares"
	"backend-bebu/internal/repositories"
	"backend-bebu/internal/services"
	"backend-bebu/pkg/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	config.LoadAndConnectDB()
	db := config.GetDB()
	config.InitCloudinary()

	loginLimiter := utils.NewLoginRateLimiter(5, 5*time.Minute, 15*time.Minute)

	userRepo := repositories.NewUserRepository(db)
	authService := services.NewAuthService(userRepo, loginLimiter)
	authHandler := handlers.NewAuthHandler(authService)

	postRepo := repositories.NewPostRepository(db)
	postService := services.NewPostService(postRepo, userRepo, db) 
	postHandler := handlers.NewPostHandler(postService) 

	bookRepo := repositories.NewBookRepository(db)
	bookService := services.NewBookService(bookRepo)
	bookHandler := handlers.NewBookHandler(bookService)

	categoryRepo := repositories.NewCategoryRepository(db)
	categoryService := services.NewCategoryService(categoryRepo)
	categoryHandler := handlers.NewCategoryHandler(categoryService)

	userService := services.NewUserService(db, userRepo)
    userHandler := handlers.NewUserHandler(userService)
	
	bookshelfRepo := repositories.NewBookshelfRepository(db)
	bookshelfService := services.NewBookshelfService(db, bookshelfRepo, userRepo)
	bookshelfHandler := handlers.NewBookshelfHandler(bookshelfService)

	authMiddleware := middlewares.NewAuthMiddleware(userRepo)

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"}, // frontend kamu
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	SetupRoutes(r, bookshelfHandler, authHandler, postHandler, bookHandler, categoryHandler, userHandler, authMiddleware)

	r.Run(":8080")
}

// --> Ubah signature fungsi untuk menerima AuthHandler
func SetupRoutes(r *gin.Engine, bookshelfHandler *handlers.BookshelfHandler, authHandler *handlers.AuthHandler, postHandler *handlers.PostHandler, bookHandler *handlers.BookHandler, categoryHandler *handlers.CategoryHandler, userHandler *handlers.UserHandler, authMiddleware *middlewares.AuthMiddleware) {
	// --> Praktik yang baik: Gunakan group untuk versioning API
	v1 := r.Group("/api/v1")

	v1.Use(middlewares.CSRFMiddleware())
	{
		auth := v1.Group("/auth")
		{
			// --> Daftarkan route register Anda di sini
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
			auth.POST("/logout", authHandler.Logout)
		}

		password := v1.Group("/password")
		{
			password.POST("/forgot", authHandler.ForgotPassword)
			password.POST("/reset", authHandler.ResetPassword)
		}

		users := v1.Group("/users")
		{
			users.GET("/recommendation", handlers.GetUserRecommendations)
			me := users.Group("/me")
			{
				me.PUT("/profile", authMiddleware.RequiredAuth(), userHandler.UpdateProfile)
				me.GET("", authMiddleware.RequiredAuth(), userHandler.GetMyProfile)
			}
			users.GET("/:username", authMiddleware.OptionalAuth(), userHandler.GetUserProfile)
			users.POST("/:username/follow", authMiddleware.RequiredAuth(), userHandler.FollowUser)
			users.DELETE("/:username/follow", authMiddleware.RequiredAuth(), userHandler.UnfollowUser)
			users.POST("/:username/block", authMiddleware.RequiredAuth(), userHandler.BlockUser)
			users.DELETE("/:username/block", authMiddleware.RequiredAuth(), userHandler.UnblockUser)
			users.GET("/:username/bookshelves", authMiddleware.OptionalAuth(), bookshelfHandler.GetUserBookshelves)

			users.GET("/:username/posts", authMiddleware.OptionalAuth(), postHandler.GetUserPosts)
			users.GET("/:username/likes", authMiddleware.OptionalAuth(), postHandler.GetUserLikedPosts)
			users.GET("/:username/saves", authMiddleware.OptionalAuth(), postHandler.GetUserSavedPosts)
		}

		followRequests := v1.Group("/follow-requests").Use(authMiddleware.RequiredAuth())
		{
			followRequests.GET("", userHandler.GetFollowRequests)
			followRequests.POST("/:username/accept", userHandler.AcceptFollowRequest)
			followRequests.DELETE("/:username/decline", userHandler.DeclineFollowRequest)
		}

		books := v1.Group("/books")
		{
			books.GET("/trending", handlers.GetTrendingBooks)
			books.GET("", bookHandler.GetBooks)
		}

		bookshelves := v1.Group("/bookshelves")
		{
			bookshelves.POST("", authMiddleware.RequiredAuth(), bookshelfHandler.AddToBookshelf)
			bookshelves.PUT("/:id", authMiddleware.RequiredAuth(), bookshelfHandler.UpdateBookshelfEntry)
			bookshelves.DELETE("/:id", authMiddleware.RequiredAuth(), bookshelfHandler.DeleteFromBookshelf)
			bookshelves.GET("/:id", authMiddleware.OptionalAuth(), bookshelfHandler.GetBookshelfEntryDetail)
			bookshelves.POST("/:id/notes", authMiddleware.RequiredAuth(), bookshelfHandler.AddNote)
		}

		notes := v1.Group("/notes").Use(authMiddleware.RequiredAuth())
		{
			notes.PUT("/:id", bookshelfHandler.UpdateNote)
			notes.DELETE("/:id", bookshelfHandler.DeleteNote)
		}



		categories := v1.Group("/categories")
		{
			categories.GET("/user", handlers.GetUserCategories)

			// 🔥 TAMBAHAN
			categories.GET("", handlers.GetAllCategories)
			categories.POST("/:id/favorite", handlers.FavoriteCategory)
			categories.DELETE("/:id/favorite", handlers.UnfavoriteCategory)
			categories.GET("/search", categoryHandler.Search)
		}

		posts := v1.Group("/posts")
		{
			posts.POST("", authMiddleware.RequiredAuth(), postHandler.CreatePost)
			posts.GET("",authMiddleware.OptionalAuth(), postHandler.GetPosts)
		}

		v1.GET("/leaderboard", handlers.GetLeaderboard)
	}
}
