package dto

import "time"

// --- Book Masters CRUD DTOs ---

type BookQueryParams struct {
	Page   int    `form:"page"`
	Limit  int    `form:"limit"`
	Search string `form:"search"`
}

type BookAuthorResponse struct {
    ID   uint   `json:"id"`
    Name string `json:"name"`
}

type BookGenreResponse struct {
    ID   uint   `json:"id"`
    Name string `json:"name"`
}

type ManageBookResponse struct {
	BookID          uint     `json:"book_id"`
	PublicID        string   `json:"public_id"`
	Title           string   `json:"title"`
	Synopsis        string   `json:"synopsis"`
	CoverImgURL     string   `json:"cover_img_url"`
	GoogleBookID    string   `json:"google_book_id"`
	PublicationYear int16    `json:"publication_year"`
	Language        string   `json:"language"`
	TotalPages      int      `json:"total_pages"`
	Slug            string   `json:"slug"`
	Authors []BookAuthorResponse `json:"authors"`
    Genres  []BookGenreResponse  `json:"genres"`
	CreatedAt       time.Time `json:"created_at"`
}

type PaginatedBookResponse struct {
	Data       []ManageBookResponse `json:"data"`
	TotalRows  int64                `json:"total_rows"`
	Page       int                  `json:"page"`
	Limit      int                  `json:"limit"`
	TotalPages int                  `json:"total_pages"`
}

type UpsertBookRequest struct {
	Title           string   `json:"title" form:"title"`
	Synopsis        string   `json:"synopsis" form:"synopsis"`
	CoverImgURL     string   `json:"cover_img_url" form:"cover_img_url"`
	GoogleBookID    string   `json:"google_book_id" form:"google_book_id"`
	PublicationYear int16    `json:"publication_year" form:"publication_year"`
	Language        string   `json:"language" form:"language"`
	TotalPages      int      `json:"total_pages" form:"total_pages"`
	
	AuthorIDs       []uint   `json:"author_ids" form:"author_ids"` 
	NewAuthorNames  []string `json:"new_author_names" form:"new_author_names"`
	GenreIDs        []uint   `json:"genre_ids" form:"genre_ids"`
	NewGenreNames   []string `json:"new_genre_names" form:"new_genre_names"`
}

// --- Book Submissions DTOs ---

type SubmissionQueryParams struct {
	Page   int    `form:"page"`
	Limit  int    `form:"limit"`
	Status string `form:"status"` // pending, approved, rejected, etc.
	Search string `form:"search"`
}

type SubmissionAuthorResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type SubmissionGenreResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type ManageSubmissionResponse struct {
	BookSubmissionID  uint                       `json:"book_submission_id"`
	SubmittedByByInfo string                     `json:"submitted_by"`
	Title             string                     `json:"title"`
	TotalPages        int                        `json:"total_pages"`
	Language          string                     `json:"language"`
	ISBN              string                     `json:"isbn"`
	Synopsis          string                     `json:"synopsis"`
	CoverImgURL       string                     `json:"cover_img_url"`
	UserNote          string                     `json:"user_note"`
	AdminNote         string                     `json:"admin_note"`
	Status            string                     `json:"status"`
	Authors           []SubmissionAuthorResponse `json:"authors"` // Diubah ke objek
	Genres            []SubmissionGenreResponse  `json:"genres"`  // Diubah ke objek
	CreatedAt         time.Time                  `json:"created_at"`
}

type PaginatedSubmissionResponse struct {
	Data       []ManageSubmissionResponse `json:"data"`
	TotalRows  int64                      `json:"total_rows"`
	Page       int                        `json:"page"`
	Limit      int                        `json:"limit"`
	TotalPages int                        `json:"total_pages"`
}

type RejectSubmissionRequest struct {
	AdminNote string `json:"admin_note" binding:"required,min=5"`
}

type AuthorSearchResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type GenreSearchResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}