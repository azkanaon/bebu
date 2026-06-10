package handlers

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/services"
	"backend-bebu/pkg/utils"
	"net/http"
	"strconv"
	"strings"

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
	// 1. Ambil ID dari URL parameter
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID format"})
		return
	}

	// 2. Bind payload JSON langsung ke DTO struct
	var req dto.UpsertBookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3. Validasi field wajib (Title) secara manual jika tidak menggunakan tag binding:`required` di struct
	if strings.TrimSpace(req.Title) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Field validation for 'Title' failed on the 'required' tag"})
		return
	}

	// 4. Validasi minimal harus ada 1 author dan 1 genre (baik lama maupun baru)
	if len(req.AuthorIDs) == 0 && len(req.NewAuthorNames) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Book must have at least one author"})
		return
	}
	if len(req.GenreIDs) == 0 && len(req.NewGenreNames) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Book must have at least one genre"})
		return
	}

	// 5. Teruskan ke service layer
	if err := h.svc.EditBook(c.Request.Context(), uint(id), req); err != nil {
		if err.Error() == "book not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Book records updated successfully"})
}

func (h *BookManagementHandler) UploadCoverImage(c *gin.Context) {
	file, err := c.FormFile("cover_image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No image file provided"})
		return
	}

	// Upload berkas ke Cloudinary menggunakan utility Anda
	url, err := utils.UploadToCloudinary(file, "bebu/books")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload image to Cloudinary"})
		return
	}

	// Kembalikan URL gambar hasil upload ke Frontend
	c.JSON(http.StatusOK, gin.H{
		"message":   "Image uploaded successfully",
		"image_url": url,
	})
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
	
	// 💡 PERBAIKAN 1: Samakan key context-nya menjadi "userID" sesuai middleware JWT Anda
	adminIDVal, exists := c.Get("userID") 
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized administrative session"})
		return
	}

	// 💡 PERBAIKAN 2: Lakukan type assertion .(uint) seperti pada handler report Anda yang sukses
	adminID, ok := adminIDVal.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid administrative token format"})
		return
	}

	var req dto.UpsertBookRequest
	// ShouldBind otomatis mendeteksi jika content-type yang datang adalah multipart/form-data
	if err := c.ShouldBind(&req); err != nil {
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
    
    // 💡 PERBAIKAN 1: Samakan key context menjadi "userID" sesuai middleware JWT Anda
    adminIDVal, exists := c.Get("userID") 
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized administrative session"})
        return
    }

    // 💡 PERBAIKAN 2: Lakukan type assertion .(uint) agar mendapatkan ID Admin yang asli
    adminID, ok := adminIDVal.(uint)
    if !ok {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid administrative token format"})
        return
    }

    var req dto.RejectSubmissionRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Sekarang adminID yang dikirim sudah merupakan ID Admin yang sedang login secara aktual
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