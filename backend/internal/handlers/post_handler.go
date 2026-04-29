package handlers

import (
	"net/http"

	"backend-bebu/internal/services"
	"backend-bebu/internal/dto"
	"backend-bebu/internal/utils"

	"github.com/gin-gonic/gin"

	"encoding/json"
	"fmt"
)

type PostHandler struct {
	service *services.PostService
}

func prettyPrint(data interface{}) {
	b, _ := json.MarshalIndent(data, "", "  ")
	fmt.Println(string(b))
}

func NewPostHandler(service *services.PostService) *PostHandler {
	return &PostHandler{service: service}
}

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

func (h *PostHandler) CreatePost(c *gin.Context) {
	var req dto.CreatePostRequest

	// ✅ manual binding dari form
	req.UserID = utils.ParseUint(c.PostForm("user_id"))
	req.BookID = utils.ParseUint(c.PostForm("book_id"))
	req.Description = c.PostForm("description")
	req.PostType = c.PostForm("post_type")
	req.Rating = utils.ParseFloat(c.PostForm("rating"))

	// ✅ categories (string JSON → []string)
	categories := c.PostForm("categories")
	if categories != "" {
		json.Unmarshal([]byte(categories), &req.Categories)
	}

	// ✅ upload image
	file, _, err := c.Request.FormFile("image")
	if err == nil {
		defer file.Close()

		url, err := utils.UploadToCloudinary(file)
		if err != nil {
			c.JSON(500, gin.H{"error": "upload failed"})
			return
		}

		req.ImgURL = url
	}

	// 👉 tetap pakai service (clean architecture 👍)
	if err := h.service.CreatePost(req); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"message": "Post created successfully",
	})
}