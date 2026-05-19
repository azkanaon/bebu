package dto

type BookResponse struct {
	BookID 	uint `json:"id"`
	Title    string `json:"title"`
}

type BookFilterResponse struct {
	Genres   []string `json:"genres"`
	Authors  []string `json:"authors"`
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
	TotalPages 		int	     `json:"total_pages"`
	Rating          float32  `json:"rating"`
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
	CoverImgURL     string   `json:"cover_img_url"`
	Rating          float32  `json:"rating"`
	TotalPages      int      `json:"total_pages"`
	Authors         []string `json:"authors"`
	PopularityScore int      `json:"popularity_score"`
}

type PopularBooksResponse struct {
	Range string            `json:"range"`
	Books []PopularBookItem `json:"books"`
}

type HighlyRatedBookItem struct {
	PublicID      string   `json:"public_id"`
	Title         string   `json:"title"`
	CoverImgURL   string   `json:"cover_img_url"`
	Rating        float32  `json:"rating"`
	WeightedScore float64  `json:"weighted_score"`
	TotalReviews  int      `json:"total_reviews"`
	TotalPages    int      `json:"total_pages"`
	Authors       []string `json:"authors"`
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