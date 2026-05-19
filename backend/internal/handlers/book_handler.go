package handlers

import (
	"net/http"

	"backend-bebu/internal/services"

	"github.com/gin-gonic/gin"

	"strconv"
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
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

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