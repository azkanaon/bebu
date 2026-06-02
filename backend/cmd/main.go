package main

import (
	"time"

	"backend-bebu/config"
	"backend-bebu/internal/handlers"
	"backend-bebu/internal/middlewares"
	"backend-bebu/internal/repositories"
	"backend-bebu/internal/services"
	"backend-bebu/internal/worker"
	"backend-bebu/internal/ws"
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

	categoryRepo := repositories.NewCategoryRepository(db)
	categoryService := services.NewCategoryService(categoryRepo)
	categoryHandler := handlers.NewCategoryHandler(categoryService)

	bookshelfRepo := repositories.NewBookshelfRepository(db)
	bookshelfService := services.NewBookshelfService(db, bookshelfRepo, userRepo)
	bookshelfHandler := handlers.NewBookshelfHandler(bookshelfService)

	hub := ws.NewHub()
	notifRepo := repositories.NewNotificationRepository(db)
	notifService := services.NewNotificationService(notifRepo, hub)
	notifHandler := handlers.NewNotificationHandler(notifService)
	wsHandler := handlers.NewWSHandler(hub)

	postRepo := repositories.NewPostRepository(db)
	postService := services.NewPostService(postRepo, userRepo, categoryRepo, bookshelfRepo,notifService, db) 
	postHandler := handlers.NewPostHandler(postService) 

	bookRepo := repositories.NewBookRepository(db)
	bookService := services.NewBookService(bookRepo)
	bookHandler := handlers.NewBookHandler(bookService)

	userService := services.NewUserService(db, userRepo, notifService)
    userHandler := handlers.NewUserHandler(userService)
	
	commentRepo := repositories.NewCommentRepository(db)
	commentService := services.NewCommentService(commentRepo, postRepo, notifService, db)
	commentHandler := handlers.NewCommentHandler(commentService)

	reportRepo := repositories.NewReportRepository(db)
    reportService := services.NewReportService(reportRepo)
    reportHandler := handlers.NewReportHandler(reportService)
	
	userManagementRepo := repositories.NewUserManagementRepository(db)
    userManagementService := services.NewUserManagementService(userManagementRepo)
    userManagementHandler := handlers.NewUserManagementHandler(userManagementService)
	
	postManagementRepo := repositories.NewPostManagementRepository(db)
    postManagementService := services.NewPostManagementService(postManagementRepo)
    postManagementHandler := handlers.NewPostManagementHandler(postManagementService)
	
	bookManagementRepo := repositories.NewBookManagementRepository(db)
    bookManagementService := services.NewBookManagementService(bookManagementRepo)
    bookManagementHandler := handlers.NewBookManagementHandler(bookManagementService)

	shareRepo := repositories.NewPostShareRepository(db)
	shareService := services.NewPostShareService(shareRepo)
	shareHandler := handlers.NewPostShareHandler(shareService)

	gamificationRepo := repositories.NewGamificationRepository(db)
	gamificationService := services.NewGamificationService(db, gamificationRepo, userRepo)
	gamificationHandler := handlers.NewGamificationHandler(gamificationService)

	platformRepo := repositories.NewPlatformRepository(db)
	platformService := services.NewPlatformService(platformRepo)
	platformHandler := handlers.NewPlatformHandler(platformService)

	searchRepo := repositories.NewSearchRepository(db)
	searchService := services.NewSearchService(searchRepo, userRepo)
	searchHandler := handlers.NewSearchHandler(searchService)

	submissionRepo := repositories.NewBookSubmissionRepository(db)
	submissionService := services.NewBookSubmissionService(submissionRepo, db)
	submissionHandler := handlers.NewBookSubmissionHandler(submissionService)

	authMiddleware := middlewares.NewAuthMiddleware(userRepo)

	worker.InitStreakWorker(bookshelfRepo)

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	SetupRoutes(r, bookshelfHandler, authHandler, postHandler, bookHandler, categoryHandler, userHandler, authMiddleware, commentHandler, reportHandler, shareHandler,gamificationHandler, platformHandler, searchHandler, notifHandler, wsHandler, userManagementHandler, postManagementHandler, submissionHandler, bookManagementHandler)

	r.Run(":8080")
}

// --> Ubah signature fungsi untuk menerima AuthHandler
func SetupRoutes(r *gin.Engine, bookshelfHandler *handlers.BookshelfHandler, authHandler *handlers.AuthHandler, postHandler *handlers.PostHandler, bookHandler *handlers.BookHandler, categoryHandler *handlers.CategoryHandler, userHandler *handlers.UserHandler, authMiddleware *middlewares.AuthMiddleware, commentHandler *handlers.CommentHandler, reportHandler *handlers.ReportHandler, shareHandler *handlers.PostShareHandler, gamificationHandler *handlers.GamificationHandler, platformHandler *handlers.PlatformHandler, searchHandler *handlers.SearchHandler, notifHandler *handlers.NotificationHandler, wsHandler *handlers.WSHandler, userManagementHandler *handlers.UserManagementHandler, postManagementHandler *handlers.PostManagementHandler, submissionHandler *handlers.BookSubmissionHandler, bookManagementHandler *handlers.BookManagementHandler) {
	// --> Praktik yang baik: Gunakan group untuk versioning API
	v1 := r.Group("/api/v1")

	v1.Use()
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
			users.GET("/:username/likes", authMiddleware.RequiredAuth(), postHandler.GetUserLikedPosts)
			users.GET("/:username/saves", authMiddleware.RequiredAuth(), postHandler.GetUserSavedPosts)
			users.GET("/search", authMiddleware.RequiredAuth(), userHandler.SearchUsers)

			users.GET("/:username/followers", authMiddleware.OptionalAuth(), userHandler.GetFollowers)
			users.GET("/:username/following", authMiddleware.OptionalAuth(), userHandler.GetFollowing)

			users.GET("/:username/badges", authMiddleware.OptionalAuth(), gamificationHandler.GetUserBadges)
    		users.GET("/:username/achievements", authMiddleware.OptionalAuth(), gamificationHandler.GetUserAchievements)

			users.GET("/:username/reading-stats", authMiddleware.OptionalAuth(), bookshelfHandler.GetReadingStreak)
		}

		profile := v1.Group("/profile").Use(authMiddleware.RequiredAuth())
		{
			profile.PUT("/favorite-badges", gamificationHandler.UpdateFavoriteBadges)
			profile.PUT("/favorite-achievements", gamificationHandler.UpdateFavoriteAchievements)
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
			books.GET("/filters", authMiddleware.OptionalAuth(), bookHandler.GetDynamicFilters)
			books.GET("/search", authMiddleware.OptionalAuth(), bookHandler.SearchBooks)
			books.GET("/popular", authMiddleware.OptionalAuth(), bookHandler.GetPopularBooks)
			books.GET("/highly-rated", authMiddleware.OptionalAuth(), bookHandler.GetHighlyRatedBooks,)
			books.GET("/all-books", authMiddleware.OptionalAuth(), bookHandler.GetAllBooks,)
			books.GET("/:slug", authMiddleware.OptionalAuth(), bookHandler.GetBookProfile)
			books.GET("/:slug/recommendations", authMiddleware.OptionalAuth(), bookHandler.GetBookRecommendations)
			books.GET("/:slug/posts", authMiddleware.OptionalAuth(), bookHandler.GetBookPosts)
		}

		bookshelves := v1.Group("/bookshelves")
		{
			bookshelves.POST("", authMiddleware.RequiredAuth(), bookshelfHandler.AddToBookshelf)
			bookshelves.PUT("/:id", authMiddleware.RequiredAuth(), bookshelfHandler.UpdateBookshelfEntry)
			bookshelves.DELETE("/:id", authMiddleware.RequiredAuth(), bookshelfHandler.DeleteFromBookshelf)
			bookshelves.GET("/:id", authMiddleware.OptionalAuth(), bookshelfHandler.GetBookshelfEntryDetail)
			bookshelves.POST("/:id/notes", authMiddleware.RequiredAuth(), bookshelfHandler.AddNote)
			bookshelves.GET("/:id/notes", authMiddleware.OptionalAuth(), bookshelfHandler.GetBookshelfNotes)
		}

		notes := v1.Group("/notes").Use(authMiddleware.RequiredAuth())
		{
			notes.PUT("/:id", bookshelfHandler.UpdateNote)
			notes.DELETE("/:id", bookshelfHandler.DeleteNote)
		}

		categories := v1.Group("/categories")
		{
			categories.GET("/user", authMiddleware.RequiredAuth(), categoryHandler.GetUserCategories)
			categories.GET("", authMiddleware.RequiredAuth(), categoryHandler.GetAllCategories)
			categories.POST("/:id/favorite", authMiddleware.RequiredAuth(), categoryHandler.FavoriteCategory)
			categories.DELETE("/:id/favorite", authMiddleware.RequiredAuth(), categoryHandler.UnfavoriteCategory)
			categories.GET("/search", authMiddleware.RequiredAuth(), categoryHandler.Search)
		}

		posts := v1.Group("/posts")
		{
			posts.POST("", authMiddleware.RequiredAuth(), postHandler.CreatePost)
			posts.GET("", authMiddleware.OptionalAuth(), postHandler.GetPosts)
			posts.GET("/:id", authMiddleware.OptionalAuth(), postHandler.GetPostByPublicID)
			posts.DELETE("/:id", authMiddleware.RequiredAuth(), postHandler.DeletePost)
			posts.GET("/:id/comments", authMiddleware.OptionalAuth(), postHandler.GetPostComments)
			posts.POST("/:id/save", authMiddleware.RequiredAuth(), postHandler.ToggleSave)
			posts.POST("/:id/like", authMiddleware.RequiredAuth(), postHandler.ToggleLike)
			
			shares := posts.Group("/shares")
			{
				shares.POST("", authMiddleware.RequiredAuth(), shareHandler.SharePost)
				shares.GET("/recent-recipients", authMiddleware.RequiredAuth(), shareHandler.GetRecentRecipients)
			}
		}

		comments := v1.Group("/comments")
		{
			comments.POST("/", authMiddleware.RequiredAuth(), commentHandler.CreateComment)
			comments.POST("/:id/like", authMiddleware.RequiredAuth(), commentHandler.ToggleLike)
			comments.DELETE("/:id",  authMiddleware.RequiredAuth(), commentHandler.DeleteComment)
		}

		search := v1.Group("/search")
		{
			search.GET("/top", authMiddleware.OptionalAuth(), searchHandler.SearchTop)
			search.GET("/books", authMiddleware.OptionalAuth(), searchHandler.SearchBooks)
			search.GET("/users", authMiddleware.OptionalAuth(), searchHandler.SearchUsers)
			search.GET("/posts", authMiddleware.OptionalAuth(), searchHandler.SearchPosts)
			search.GET("/history", authMiddleware.RequiredAuth(), searchHandler.GetHistory)
			
			search.DELETE("/history/all",authMiddleware.RequiredAuth(), searchHandler.ClearAllHistory)
			search.DELETE("/history/:id",authMiddleware.RequiredAuth(), searchHandler.DeleteHistory)
		}

		notifRoutes := v1.Group("/notifications").Use(authMiddleware.RequiredAuth())
		{
			notifRoutes.GET("", notifHandler.GetMyNotifications)
			notifRoutes.PUT("/:id/read", notifHandler.MarkAsRead)
			notifRoutes.PUT("/read-all", notifHandler.MarkAllAsRead) 
			notifRoutes.GET("/unread-count", notifHandler.GetUnreadCount)
		}

		admin := v1.Group("/admin")
		admin.Use(authMiddleware.RequiredAuth())
		{
			admin.GET("/reports", reportHandler.GetReportDashboard)
			admin.GET("/reports/:id/detail", reportHandler.GetPopUpDetail)
			admin.POST("/reports/action", reportHandler.TakeAction)
			admin.GET("/users", userManagementHandler.GetUsersDashboard)
			admin.PUT("/users/:id/status", userManagementHandler.UpdateStatus)
			admin.GET("/posts", postManagementHandler.GetPosts)
    		admin.PUT("/posts/:id/status", postManagementHandler.UpdatePostStatus)
		
			adminBook := admin.Group("/books")
			{
				// Master Books Catalogue
				adminBook.GET("", bookManagementHandler.GetBooks)
				adminBook.POST("", bookManagementHandler.CreateBook)
				adminBook.PUT("/:id", bookManagementHandler.UpdateBook)
				adminBook.DELETE("/:id", bookManagementHandler.DeleteBook)

				// User Submissions Management
				adminBook.GET("/submissions", bookManagementHandler.GetSubmissions)
				adminBook.POST("/submissions/:id/approve", bookManagementHandler.ApproveSubmission)
				adminBook.POST("/submissions/:id/reject", bookManagementHandler.RejectSubmission)
			}
		}

		sub := v1.Group("/submissions").Use(authMiddleware.RequiredAuth())
		{
			sub.POST("", submissionHandler.Submit)
			sub.GET("/my", submissionHandler.GetMySubmissions)
			sub.PATCH("/:id", submissionHandler.Update) 
			sub.DELETE("/:id", submissionHandler.Delete)
		}

		v1.GET("/ws", authMiddleware.RequiredAuth(), wsHandler.HandleWS)

		v1.GET("/leaderboard", handlers.GetLeaderboard)
		v1.GET("/platforms", platformHandler.GetAllPlatforms)

		v1.POST("/report", authMiddleware.RequiredAuth(), reportHandler.CreateReport)

		// Search Authors
		v1.GET("/authors/search", authMiddleware.RequiredAuth(), bookManagementHandler.SearchAuthors)
		v1.GET("/genres/search", authMiddleware.RequiredAuth(), bookManagementHandler.SearchGenres)
	}
}
