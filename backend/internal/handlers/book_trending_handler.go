package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"backend-bebu/config"
	"backend-bebu/internal/models"
)


// ==============================
// 📦 RESPONSE STRUCT
// ==============================

type TrendingBookResponse struct {
	ID     uint    `json:"id"`
	Title  string  `json:"title"`
	Genre  string  `json:"genre"`
	Rating float64 `json:"rating"`
	Cover  string  `json:"cover"`
}


// ==============================
// 🧠 HELPER: Format Genres
// ==============================

func formatGenres(genres []models.Genre) string {
	if len(genres) == 0 {
		return "-"
	}

	max := 3
	if len(genres) < 3 {
		max = len(genres)
	}

	result := genres[0].GenreName
	for i := 1; i < max; i++ {
		result += ", " + genres[i].GenreName
	}

	if len(genres) > 3 {
		result += ", ..."
	}

	return result
}


// ==============================
// 🚀 HANDLER: TRENDING BOOKS
// ==============================

func GetTrendingBooks(c *gin.Context) {

	// =========================
	// 1️⃣ GET BOOKS + GENRES
	// =========================
	var books []models.Book

	err := config.DB.
		Preload("Genres").
		Order("book_id").
		Limit(3).
		Find(&books).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch books"})
		return
	}

	// =========================
	// 2️⃣ COLLECT BOOK IDs
	// =========================
	var bookIDs []uint
	for _, b := range books {
		bookIDs = append(bookIDs, b.BookID)
	}

	// =========================
	// 3️⃣ GET RATINGS (1 QUERY)
	// =========================
	type RatingResult struct {
		BookID uint
		Avg    float64
	}

	var ratings []RatingResult

	err = config.DB.
		Model(&models.Post{}).
		Select("book_id, AVG(rating) as avg").
		Where("book_id IN ? AND post_type = ? AND rating IS NOT NULL", bookIDs, "review").
		Group("book_id").
		Scan(&ratings).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch ratings"})
		return
	}

	// =========================
	// 4️⃣ MAP RATINGS
	// =========================
	ratingMap := make(map[uint]float64)
	for _, r := range ratings {
		ratingMap[r.BookID] = r.Avg
	}

	// =========================
	// 5️⃣ BUILD RESPONSE
	// =========================
	var response []TrendingBookResponse

	for _, b := range books {

		rating := 0.0
		if val, ok := ratingMap[b.BookID]; ok {
			rating = val
		}

		response = append(response, TrendingBookResponse{
			ID:     b.BookID,
			Title:  b.Title,
			Genre:  formatGenres(b.Genres),
			Rating: rating,
			Cover:  b.CoverImgURL,
		})
	}

	// =========================
	// ✅ FINAL RESPONSE
	// =========================
	c.JSON(http.StatusOK, response)
}