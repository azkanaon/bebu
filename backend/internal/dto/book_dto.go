package dto

import "time"

type BookResponse struct {
	BookID uint   `json:"id"`
	Title  string `json:"title"`
}

type BookFilterResponse struct {
	Genres    []string `json:"genres"`
	Authors   []string `json:"authors"`
	Languages []string `json:"languages"`
}

type BookSearchItem struct {
	PublicID        string   `json:"public_id"`
	Title           string   `json:"title"`
	Synopsis        string   `json:"synopsis"`
	CoverImgURL     string   `json:"cover_img_url"`
	PublicationYear int16    `json:"publication_year"`
	Language        string   `json:"language"`
	Authors         []string `json:"authors"`
	Genres          []string `json:"genres"`
	TotalPages      int      `json:"total_pages"`
	Rating          float32  `json:"rating"`
	GoogleBookID    string   `json:"google_books_id"`
	Slug	        string   `json:"slug"`
}

type BookSearchResponse struct {
	Books      []BookSearchItem `json:"books"`
	Page       int              `json:"page"`
	Limit      int              `json:"limit"`
	Total      int64            `json:"total"`
	TotalPages int              `json:"total_pages"`
}

type PopularBookItem struct {
	PublicID        string   `json:"public_id"`
	Title           string   `json:"title"`
	Slug            string   `json:"slug"`
	CoverImgURL     string   `json:"cover_img_url"`
	Rating          float32  `json:"rating"`
	TotalPages      int      `json:"total_pages"`
	Authors         []string `json:"authors"`
	PopularityScore int      `json:"popularity_score"`
	PublicationYear int16    `json:"publication_year"`
}

type PopularBooksResponse struct {
	Range string            `json:"range"`
	Books []PopularBookItem `json:"books"`
}

type HighlyRatedBookItem struct {
	PublicID        string   `json:"public_id"`
	Title           string   `json:"title"`
	Slug            string   `json:"slug"`
	CoverImgURL     string   `json:"cover_img_url"`
	Rating          float32  `json:"rating"`
	WeightedScore   float64  `json:"weighted_score"`
	TotalReviews    int      `json:"total_reviews"`
	TotalPages      int      `json:"total_pages"`
	Authors         []string `json:"authors"`
	PublicationYear int16    `json:"publication_year"`
}

type HighlyRatedBooksResponse struct {
	Books []HighlyRatedBookItem `json:"books"`
}

type AllBooksResponse struct {
	Books      []BookSearchItem `json:"books"`
	Page       int              `json:"page"`
	Limit      int              `json:"limit"`
	Total      int64            `json:"total"`
	TotalPages int              `json:"total_pages"`
}

/* BOOK PROFILE */
type AuthorDTO struct {
	PublicID   string `json:"public_id"`
	AuthorName string `json:"author_name"`
	Slug       string `json:"slug"`
}

type GenreDTO struct {
	GenreName string `json:"genre_name"`
	Slug      string `json:"slug"`
}

type BookStatDTO struct {
	OverallRating  float32 `json:"overall_rating"`
	TotalRatingSum int     `json:"total_rating_sum"`
	TotalReviews   int     `json:"total_reviews"`
	TotalPosts     int     `json:"total_posts"`
	Rating1Count   int     `json:"rating_1_count"`
	Rating2Count   int     `json:"rating_2_count"`
	Rating3Count   int     `json:"rating_3_count"`
	Rating4Count   int     `json:"rating_4_count"`
	Rating5Count   int     `json:"rating_5_count"`
}

type BookProfileResponse struct {
	BookID        	uint      	`json:"book_id"`
	PublicID        string      `json:"public_id"`
	Title           string      `json:"title"`
	Synopsis        string      `json:"synopsis"`
	CoverImgURL     string      `json:"cover_img_url"`
	PublicationYear int16       `json:"publication_year"`
	Language        string      `json:"language"`
	TotalPages      int         `json:"total_pages"`
	Slug            string      `json:"slug"`
	GoogleBookID    string      `json:"google_book_id"`
	Authors         []AuthorDTO `json:"authors"` // Di-flatten
	Genres          []GenreDTO  `json:"genres"`  // Di-flatten
	Stats           BookStatDTO `json:"stats"`   // Dibungkus rapi
}

// Rekomendasi Buku Based On Genre and Author
type RecommendationBookItem struct {
	PublicID        string `json:"public_id"`
	Title           string `json:"title"`
	CoverImgURL     string `json:"cover_img_url"`
	FirstAuthor     string `json:"first_author"`
	TotalPages      int    `json:"total_pages"`
	PublicationYear int16  `json:"publication_year"`
	Slug            string `json:"slug"`
	Rating          float32 `json:"rating"`
}

type BookRecommendationsResponse struct {
	GenreRecommendations  []RecommendationBookItem `json:"genre_recommendations"`
	AuthorRecommendations []RecommendationBookItem `json:"author_recommendations"`
}

// Postingan
type BookPostReviewResponse struct {
	ID           uint      `json:"id"`
	PostPublicID string    `json:"post_public_id"`
	Type         string    `json:"type"`
	CreatedAt    time.Time `json:"createdAt"`
	Content      string    `json:"content"`
	IsLiked      bool      `json:"is_liked"`
	IsSaved      bool      `json:"is_saved"`
	Rating       int       `json:"rating"`
	Likes        int       `json:"likes"`
	Comments     int       `json:"comments"`
	Shares       int       `json:"shares"`

	User struct {
		PublicID    string `json:"publicID"`
		Username    string `json:"username"`
		DisplayName string `json:"displayName"`
		Avatar      string `json:"avatar"`
	} `json:"user"`

	Book struct {
		Title  string   `json:"title"`
		Author string   `json:"author"`
		Pages  int      `json:"pages"`
		Cover  string   `json:"cover"`
		Genres []string `json:"genres"`
		Rating float32  `json:"rating"` // Konsisten menggunakan float32
	} `json:"book"`
}

type BookPostAnalysisResponse struct {
	ID           uint      `json:"id"`
	PostPublicID string    `json:"post_public_id"`
	Type         string    `json:"type"`
	Content      string    `json:"content"`
	Image        string    `json:"image"`
	CreatedAt    time.Time `json:"createdAt"`
	IsLiked      bool      `json:"is_liked"`
	IsSaved      bool      `json:"is_saved"`
	Likes        int       `json:"likes"`
	Comments     int       `json:"comments"`
	Shares       int       `json:"shares"`

	User struct {
		PublicID    string `json:"publicID"`
		DisplayName string `json:"displayName"`
		Avatar      string `json:"avatar"`
	} `json:"user"`

	Book struct {
		Title string `json:"title"`
		Cover string `json:"cover"`
	} `json:"book"`

	Categories []CategoryResponse `json:"categories"`
}