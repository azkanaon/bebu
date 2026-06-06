package handlers

import (
	"backend-bebu/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type BookHandler struct {
	service services.BookService
}

func NewBookHandler(s services.BookService) *BookHandler {
	return &BookHandler{s}
}

func (h *BookHandler) GetBooks(c *gin.Context) {
	books, err := h.service.GetBooks()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "failed to fetch books",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": books,
	})
}

func (h *BookHandler) GetDynamicFilters(c *gin.Context) {
	genre := c.Query("genre")
	author := c.Query("author")
	language := c.Query("language")

	result, err := h.service.GetDynamicFilters(
		genre,
		author,
		language,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *BookHandler) SearchBooks(c *gin.Context) {

	query := c.Query("q")
	genre := c.Query("genre")
	author := c.Query("author")
	language := c.Query("language")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "12"))

	result, err := h.service.SearchBooks(
		query,
		genre,
		author,
		language,
		page,
		limit,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *BookHandler) GetPopularBooks(c *gin.Context,) {

	timeRange := c.DefaultQuery(
		"range",
		"all",
	)

	result, err := h.service.
		GetPopularBooks(timeRange)

	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"message": err.Error(),
			},
		)
		return
	}

	c.JSON(
		http.StatusOK,
		result,
	)
}

func (h *BookHandler) GetHighlyRatedBooks(c *gin.Context,) {
	result, err := h.service.GetHighlyRatedBooks()

	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"message": err.Error(),
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		result,
	)
}

func (h *BookHandler) GetAllBooks(c *gin.Context,) {
	page, _ := strconv.Atoi(
		c.DefaultQuery("page", "1"),
	)

	limit, _ := strconv.Atoi(
		c.DefaultQuery("limit", "20"),
	)

	sort := c.DefaultQuery(
		"sort",
		"title",
	)

	result, err :=
		h.service.GetAllBooks(
			page,
			limit,
			sort,
		)

	if err != nil {

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"message":
					err.Error(),
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		result,
	)
}

/* --- BOOK PROFILE --- */

func (h *BookHandler) GetBookProfile(c *gin.Context) {
	slug := c.Param("slug")

	book, err := h.service.GetBookProfile(c.Request.Context(), slug)
	if err != nil {
		if err.Error() == "book not found" {
			c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "book profile retrieved successfully",
		"data":    book,
	})
}

func (h *BookHandler) GetBookTitle(c *gin.Context) {
	slug := c.Param("slug")

	title, err := h.service.GetBookTitle(c.Request.Context(), slug)
	if err != nil {
		if err.Error() == "book not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	// Output sesuai permintaan Anda: hanya title
	c.JSON(http.StatusOK, gin.H{
		"title": title,
	})
}

func (h *BookHandler) GetBookRecommendations(c *gin.Context) {
	slug := c.Param("slug")

	recommendations, err := h.service.GetBookRecommendations(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "failed to fetch recommendations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "book recommendations retrieved successfully",
		"data":    recommendations,
	})
}

func (h *BookHandler) GetBookPosts(c *gin.Context) {
	slug := c.Param("slug")
	
	// Default tab ke "review", opsi lain adalah "analysis"
	tab := c.DefaultQuery("tab", "review") 
	
	cursorStr := c.DefaultQuery("cursor", "0")
	cursor, _ := strconv.ParseUint(cursorStr, 10, 32)
	
	limitStr := c.DefaultQuery("limit", "10")
	limit, _ := strconv.Atoi(limitStr)

	// Ambil userID dari context auth middleware (jika user sudah login)
	var currentUserID uint
	val, exists := c.Get("userID")
	if exists {
		currentUserID = val.(uint)
	}

	// Panggil service
	data, err := h.service.GetBookPosts(c.Request.Context(), slug, tab, uint(cursor), limit, currentUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "failed to fetch book posts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "book posts retrieved successfully",
		"data":    data,
	})
}