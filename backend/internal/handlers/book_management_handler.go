package handlers

import (
	"net/http"
	"strconv"
	"backend-bebu/internal/dto"
	"backend-bebu/internal/services"

	"github.com/gin-gonic/gin"
)

type BookManagementHandler struct {
	svc services.BookManagementService
}

func NewBookManagementHandler(svc services.BookManagementService) *BookManagementHandler {
	return &BookManagementHandler{svc: svc}
}

// GET /api/admin/books
func (h *BookManagementHandler) GetBooks(c *gin.Context) {
	var params dto.BookQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.svc.FetchBooks(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// POST /api/admin/books
func (h *BookManagementHandler) CreateBook(c *gin.Context) {
	var req dto.UpsertBookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.AddDirectBook(c.Request.Context(), req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Book successfully added to database"})
}

// PUT /api/admin/books/:id
func (h *BookManagementHandler) UpdateBook(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID format"})
		return
	}

	var req dto.UpsertBookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.EditBook(c.Request.Context(), uint(id), req); err != nil {
		// Pengecekan error handling yang lebih ramah client
		if err.Error() == "book not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "one or more genre_ids are invalid" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Book records updated successfully"})
}

// DELETE /api/admin/books/:id
func (h *BookManagementHandler) DeleteBook(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if err := h.svc.RemoveBook(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Book records soft-deleted successfully"})
}

// GET /api/admin/books/submissions
func (h *BookManagementHandler) GetSubmissions(c *gin.Context) {
	var params dto.SubmissionQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.svc.FetchSubmissions(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// POST /api/admin/books/submissions/:id/approve
func (h *BookManagementHandler) ApproveSubmission(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	
	// Ekstrak admin_id dari JWT token middleware context anda
	adminID := c.GetUint("user_id") 
	if adminID == 0 { adminID = 1 } // Fallback testing

	var req dto.UpsertBookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.ApproveAndPublishBook(c.Request.Context(), uint(id), adminID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Submission approved and book is now live!"})
}

// POST /api/admin/books/submissions/:id/reject
func (h *BookManagementHandler) RejectSubmission(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	adminID := c.GetUint("user_id")
	if adminID == 0 { adminID = 1 }

	var req dto.RejectSubmissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.RejectSubmission(c.Request.Context(), uint(id), adminID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Submission rejected successfully"})
}

func (h *BookManagementHandler) SearchAuthors(c *gin.Context) {
	query := c.Query("q") // Menangkap query string "?q=" dari URL

	res, err := h.svc.SearchAuthors(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query database registry"})
		return
	}

	// Format dibungkus dalam properti "data" sesuai keinginan penampung data FE: data?.data
	c.JSON(http.StatusOK, gin.H{
		"data": res,
	})
}

func (h *BookManagementHandler) SearchGenres(c *gin.Context) {
	query := c.Query("q") // Menangkap query string "?q=" dari URL

	res, err := h.svc.SearchGenres(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query database registry"})
		return
	}

	// Format dibungkus dalam properti "data" sesuai keinginan penampung data FE
	c.JSON(http.StatusOK, gin.H{
		"data": res,
	})
}