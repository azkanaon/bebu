package dto

import "time"

// --- Book Masters CRUD DTOs ---

type BookQueryParams struct {
	Page   int    `form:"page"`
	Limit  int    `form:"limit"`
	Search string `form:"search"`
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
	Authors         []string `json:"authors"`
	Genres          []string `json:"genres"`
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
	Title           string   `json:"title" binding:"required"`
	Synopsis        string   `json:"synopsis"`
	CoverImgURL     string   `json:"cover_img_url"`
	GoogleBookID    string   `json:"google_book_id"`
	PublicationYear int16    `json:"publication_year"`
	Language        string   `json:"language"`
	TotalPages      int      `json:"total_pages"`
	AuthorNames     []string `json:"author_names" binding:"required,min=1"`
	GenreNames      []string `json:"genre_names" binding:"required,min=1"`
}

// --- Book Submissions DTOs ---

type SubmissionQueryParams struct {
	Page   int    `form:"page"`
	Limit  int    `form:"limit"`
	Status string `form:"status"` // pending, approved, rejected, etc.
	Search string `form:"search"`
}

type ManageSubmissionResponse struct {
	BookSubmissionID  uint     `json:"book_submission_id"`
	SubmittedByByInfo string   `json:"submitted_by"` // Format: "Display Name (@username)"
	Title             string   `json:"title"`
	TotalPages        int      `json:"total_pages"`
	Language          string   `json:"language"`
	ISBN              string   `json:"isbn"`
	Synopsis          string   `json:"synopsis"`
	CoverImgURL       string   `json:"cover_img_url"`
	UserNote          string   `json:"user_note"`
	AdminNote         string   `json:"admin_note"`
	Status            string   `json:"status"`
	Authors           []string `json:"authors"`
	CreatedAt         time.Time `json:"created_at"`
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