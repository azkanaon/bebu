package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"errors"
	"context"
	"time"

	"backend-bebu/internal/dto"
	"backend-bebu/internal/services"
	"backend-bebu/pkg/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)


type PostHandler struct {
	service services.PostService
	expService services.ExpService
}

// prettyPrint tetap bisa Anda gunakan untuk debugging
func prettyPrint(data interface{}) {
	b, _ := json.MarshalIndent(data, "", "  ")
	fmt.Println(string(b))
}

func NewPostHandler(service services.PostService, expService services.ExpService) *PostHandler {
	return &PostHandler{
		service:    service,
		expService: expService,
	}
}

func (h *PostHandler) GetPosts(c *gin.Context) {
    var currentUserID uint
    val, exists := c.Get("userID")
    if exists {
        currentUserID = val.(uint)
    }
    
    // Ambil parameter dari query string
    tab := c.DefaultQuery("tab", "recommended")
    
    // String to Int (dengan default value)
    cursorStr := c.DefaultQuery("cursor", "0")
    cursor, _ := strconv.ParseUint(cursorStr, 10, 32)
    
    limitStr := c.DefaultQuery("limit", "10")
    limit, _ := strconv.Atoi(limitStr)

    // Proteksi tab following
    if tab == "following" && !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Please login to see following posts"})
        return
    }

    categoryIDStr := c.Query("category_id")
    categoryID, _ := strconv.ParseUint(categoryIDStr, 10, 32)

    // Kirim categoryID (akan bernilai 0 jika tidak ada di query string)
    data, err := h.service.GetPosts(currentUserID, tab, uint(cursor), limit, uint(categoryID))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts"})
        return
    }

    c.JSON(http.StatusOK, data)
}

func (h *PostHandler) GetPostByPublicID(c *gin.Context) {
	var currentUserID uint
	val, exists := c.Get("userID")
	if exists {
		currentUserID = val.(uint)
	}

	// Mengambil publicID dari URL path parameter (/posts/:publicID)
	publicID := c.Param("id")
	if publicID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Public ID is required"})
		return
	}

	data, err := h.service.GetPostByPublicID(currentUserID, publicID)
	if err != nil {
		// Jika data tidak ditemukan di GORM
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch post detail"})
		return
	}

	c.JSON(http.StatusOK, data)
}

// CreatePost tidak perlu diubah secara signifikan.
func (h *PostHandler) CreatePost(c *gin.Context) {
	var req dto.CreatePostRequest

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
	req.PostType = c.PostForm("post_type") // nilainya: "review" atau "analysis"
	
	if ratingStr := c.PostForm("rating"); ratingStr != "" {
		rating, err := strconv.ParseFloat(ratingStr, 64)
		if err == nil {
			req.Rating = rating
		}
	}

	if categoriesJSON := c.PostForm("categories"); categoriesJSON != "" {
		json.Unmarshal([]byte(categoriesJSON), &req.Categories)
	}

	file, err := c.FormFile("image")
	if err == nil {
		url, err := utils.UploadToCloudinary(file, "bebu/posts")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "upload failed"})
			return
		}
		req.ImgURL = url
	} else if err != http.ErrMissingFile {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid image file"})
		return
	}

	// Eksekusi penyimpanan Post utama ke Database SQL
	if err := h.service.CreatePost(req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Jalankan di background agar user tidak merasakan delay/lag saat memposting.
	go func(uID uint, pType string) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second) // Naikkan ke 10 detik untuk antisipasi koneksi lambat
		defer cancel()

		sourceType := "POST_REVIEW"
		if pType == "analysis" {
			sourceType = "POST_BEDAH"
		}

		var sourceID *uint = nil 

		fmt.Printf("[DEBUG-EXP] Memulai proses RewardExp untuk UserID: %d, Type: %s\n", uID, sourceType)

		// Panggil ExpService dan tangkap error-nya langsung di sini untuk di-print
		err := h.expService.RewardExp(ctx, uID, sourceID, sourceType)
		if err != nil {
			fmt.Printf("[ERROR-EXP] Gagal memberikan EXP di background: %v\n", err)
		} else {
			fmt.Printf("[SUCCESS-EXP] Berhasil menambahkan EXP dan mengupdate Redis untuk UserID: %d\n", uID)
		}
	}(req.UserID, req.PostType)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Post created successfully",
	})
}

func (h *PostHandler) DeletePost(c *gin.Context) {
    postPublicID := c.Param("id") 

    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
        return
    }

    err := h.service.DeletePost(postPublicID, userID.(uint))
    if err != nil {
        status := http.StatusInternalServerError
        if err.Error() == "post not found or you're not authorized" {
            status = http.StatusForbidden
        }
        c.JSON(status, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Post deleted successfully",
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

func (h *PostHandler) ToggleLike(c *gin.Context) {
    postID, _ := strconv.Atoi(c.Param("id"))
    uid, _ := c.Get("userID")

    isLiked, err := h.service.ToggleLike(uint(postID), uid.(uint))
    if err != nil {
        c.JSON(500, gin.H{"error": "Gagal update like"})
        return
    }
    c.JSON(200, gin.H{"is_liked": isLiked})
}

func (h *PostHandler) ToggleSave(c *gin.Context) {
    // 1. Ambil UserID dari Middleware
    val, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
        return
    }
    userID := val.(uint)

    // 2. Ambil PostID dari URL (/posts/:id/save)
    postIDStr := c.Param("id")
    postID, err := strconv.ParseUint(postIDStr, 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
        return
    }

    // 3. Eksekusi Toggle
    isSaved, err := h.service.ToggleSave(userID, uint(postID))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    status := "saved"
    if !isSaved {
        status = "unsaved"
    }

    c.JSON(http.StatusOK, gin.H{
        "message":  "Post " + status + " successfully",
        "is_saved": isSaved,
    })
}

func (h *PostHandler) GetPostComments(c *gin.Context) {
    postID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
    userID := c.MustGet("userID").(uint)

    // Service sekarang memberikan data yang sudah "siap saji" (DTO)
    comments, err := h.service.GetComments(uint(postID), userID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "status": "success",
        "data":   comments,
    })
}