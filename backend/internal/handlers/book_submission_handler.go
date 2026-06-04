package handlers

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/services"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type BookSubmissionHandler struct {
	service services.BookSubmissionService
}

func NewBookSubmissionHandler(s services.BookSubmissionService) *BookSubmissionHandler {
	return &BookSubmissionHandler{service: s}
}

func (h *BookSubmissionHandler) Submit(c *gin.Context) {
	userIDValue, _ := c.Get("userID")
	userID := userIDValue.(uint)

	var req dto.CreateBookSubmissionRequest

	// 1. Parsing Data Teks
	req.Title = c.PostForm("title")
	req.Synopsis = c.PostForm("synopsis")
	req.Language = c.PostForm("language")
	req.ISBN = c.PostForm("isbn")
	req.UserNote = c.PostForm("user_note")
	year, _ := strconv.Atoi(c.PostForm("publication_year"))
    req.PublicationYear = year
	totalPages, _ := strconv.Atoi(c.PostForm("total_pages"))
	req.TotalPages = totalPages

	// 2. Parsing Array (Authors & Genres dikirim sebagai JSON string dari FE)
	// Contoh: authors = '["Tere Liye", "Dee Lestari"]'
	authorsJSON := c.PostForm("authors")
	if authorsJSON != "" {
		json.Unmarshal([]byte(authorsJSON), &req.Authors)
	}

	genresJSON := c.PostForm("genres")
	if genresJSON != "" {
		json.Unmarshal([]byte(genresJSON), &req.Genres)
	}

	// 3. Ambil File Cover
	file, _ := c.FormFile("cover")

	// 4. Eksekusi
	if err := h.service.CreateSubmission(userID, req, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Pengajuan buku berhasil dikirim!"})
}

func (h *BookSubmissionHandler) GetMySubmissions(c *gin.Context) {
	// 1. Ambil userID dari context (Wajib login)
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := userIDValue.(uint)

	// 2. Parse query parameters
	status := c.Query("status") // opsional: approved, pending, rejected
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	// 3. Panggil Service
	submissions, pagination, err := h.service.GetMySubmissions(userID, status, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch your submissions"})
		return
	}

	// 4. Response
	c.JSON(http.StatusOK, gin.H{
		"data": submissions,
		"meta": pagination,
	})
}

func (h *BookSubmissionHandler) Update(c *gin.Context) {
	userID, _ := c.Get("userID")

	// Parse ID dari URL /submissions/:id
	subID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}

	var req dto.CreateBookSubmissionRequest
	if val, ok := c.GetPostForm("remove_cover"); ok {
        b, err := strconv.ParseBool(val)
        if err == nil {
            req.RemoveCover = &b
        }
    }
	// Binding manual dari form-data
	req.Title = c.PostForm("title")
	req.Synopsis = c.PostForm("synopsis")
	req.Language = c.PostForm("language")
	req.ISBN = c.PostForm("isbn")
	req.UserNote = c.PostForm("user_note")
	year, _ := strconv.Atoi(c.PostForm("publication_year"))
    req.PublicationYear = year
	tp, _ := strconv.Atoi(c.PostForm("total_pages"))
	req.TotalPages = tp
	
	// Parsing Array JSON
	if authorsJSON := c.PostForm("authors"); authorsJSON != "" {
		json.Unmarshal([]byte(authorsJSON), &req.Authors)
	}
	if genresJSON := c.PostForm("genres"); genresJSON != "" {
		json.Unmarshal([]byte(genresJSON), &req.Genres)
	}

	cover, _ := c.FormFile("cover")

	if err := h.service.UpdateSubmission(userID.(uint), uint(subID), req, cover); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Submission updated successfully!"})
}

func (h *BookSubmissionHandler) Delete(c *gin.Context) {
	userIDValue, _ := c.Get("userID")
	userID := userIDValue.(uint)

	// Ambil ID dari URL: /api/v1/submissions/:id
	subID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ID format"})
		return
	}

	if err := h.service.DeleteSubmission(userID, uint(subID)); err != nil {
		// Kita berikan response spesifik berdasarkan pesan error service
		status := http.StatusInternalServerError
		if err.Error() == "submission not found" {
			status = http.StatusNotFound
		} else if err.Error() == "forbidden: you can only delete your own submission" {
			status = http.StatusForbidden
		} else if err.Error() == "cannot delete: submission has already been processed by admin" {
			status = http.StatusBadRequest
		}

		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Submission deleted successfully"})
}