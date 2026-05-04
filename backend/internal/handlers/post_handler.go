package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"backend-bebu/internal/dto" // Menggunakan alias dto
	"backend-bebu/internal/services"
	"backend-bebu/pkg/utils" // Asumsi utils ada di pkg

	"github.com/gin-gonic/gin"
)


type PostHandler struct {
	service services.PostService
}

// prettyPrint tetap bisa Anda gunakan untuk debugging
func prettyPrint(data interface{}) {
	b, _ := json.MarshalIndent(data, "", "  ")
	fmt.Println(string(b))
}

// --- 2. Ubah "Pabrik" Handler ---
// NewPostHandler sekarang menerima interface PostService.
func NewPostHandler(service services.PostService) *PostHandler {
	return &PostHandler{service: service}
}


// --- 3. Method yang Sudah Ada (GetPosts, CreatePost) ---

// GetPosts tidak perlu diubah secara signifikan.
func (h *PostHandler) GetPosts(c *gin.Context) {
	data, err := h.service.GetPosts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch posts",
		})
		return
	}
	c.JSON(http.StatusOK, data)
}

// CreatePost tidak perlu diubah secara signifikan.
func (h *PostHandler) CreatePost(c *gin.Context) {
	var req dto.CreatePostRequest

	// ✅ manual binding dari form (sudah bagus)
	// Kita asumsikan UserID didapat dari context, bukan form, untuk keamanan.
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, ok := userIDValue.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format in context"})
		return
	}
	req.UserID = userID
	
	bookID, _ := strconv.Atoi(c.PostForm("book_id"))
	req.BookID = uint(bookID)
	req.Description = c.PostForm("description")
	req.PostType = c.PostForm("post_type")
	
	// Parsing rating (opsional)
	if ratingStr := c.PostForm("rating"); ratingStr != "" {
		rating, err := strconv.ParseFloat(ratingStr, 64)
		if err == nil {
			req.Rating = rating
		}
	}

	// ✅ categories (string JSON → []string)
	if categoriesJSON := c.PostForm("categories"); categoriesJSON != "" {
		json.Unmarshal([]byte(categoriesJSON), &req.Categories)
	}

	// ✅ upload image (sedikit disederhanakan)
	file, err := c.FormFile("image")
	if err == nil {
		// Asumsi UploadToCloudinary Anda sekarang menerima *multipart.FileHeader
		url, err := utils.UploadToCloudinary(file, "bebu/posts") // Tambahkan folder
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "upload failed"})
			return
		}
		req.ImgURL = url
	} else if err != http.ErrMissingFile {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid image file"})
		return
	}

	if err := h.service.CreatePost(req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Post created successfully",
	})
}

// GetUserPosts adalah handler untuk GET /users/:username/posts
func (h *PostHandler) GetUserPosts(c *gin.Context) {
	// 1. Ambil path parameter
	username := c.Param("username")

	// 2. Ambil query parameters untuk paginasi dengan nilai default
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "12"))
	if limit < 1 {
		limit = 12
	}

	// 3. Ambil viewerID dari context (opsional)
	var viewerID *uint
	if id, exists := c.Get("userID"); exists {
		if castedID, ok := id.(uint); ok {
			viewerID = &castedID
		}
	}

	// 4. Panggil service untuk mendapatkan data
	posts, pagination, err := h.service.GetUserPosts(viewerID, username, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user posts"})
		return
	}

	// 5. Kirim response
	c.JSON(http.StatusOK, gin.H{
		"data": posts,
		"meta": pagination,
	})
}

func (h *PostHandler) GetUserLikedPosts(c *gin.Context) {
	// Langkah 1, 2, 3 sama persis dengan GetUserPosts
	username := c.Param("username")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "12"))
	
	var viewerID *uint
	if id, exists := c.Get("userID"); exists {
		if castedID, ok := id.(uint); ok {
			viewerID = &castedID
		}
	}

	// 4. Panggil service yang berbeda
	posts, pagination, err := h.service.GetUserLikedPosts(viewerID, username, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user liked posts"})
		return
	}

	// 5. Kirim response
	c.JSON(http.StatusOK, gin.H{"data": posts, "meta": pagination})
}

func (h *PostHandler) GetUserSavedPosts(c *gin.Context) {
	username := c.Param("username")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "12"))
	
	var viewerID *uint
	if id, exists := c.Get("userID"); exists {
		if castedID, ok := id.(uint); ok {
			viewerID = &castedID
		}
	}

	// Panggil service yang sesuai untuk "saved posts"
	posts, pagination, err := h.service.GetUserSavedPosts(viewerID, username, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user saved posts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": posts, "meta": pagination})
}