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

func formatGenres(bookGenres []models.BookGenre) string {
	if len(bookGenres) == 0 {
		return "-"
	}

	max := 3
	if len(bookGenres) < 3 {
		max = len(bookGenres)
	}

	result := ""

	for i := 0; i < max; i++ {
		name := bookGenres[i].Genre.GenreName

		if name == "" {
			continue
		}

		if result == "" {
			result = name
		} else {
			result += ", " + name
		}
	}

	if len(bookGenres) > 3 {
		result += ", ..."
	}

	if result == "" {
		return "-"
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
		Preload("BookGenres.Genre").
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
			Genre:  formatGenres(b.BookGenres),
			Rating: rating,
			Cover:  b.CoverImgURL,
		})
	}

	// =========================
	// ✅ FINAL RESPONSE
	// =========================
	c.JSON(http.StatusOK, response)
}