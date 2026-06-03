package dto

import "time"

type SubmissionItemInput struct {
	ID   uint   `json:"id"`   // Terisi jika milih yang sudah ada
	Name string `json:"name"` // Terisi jika mengusulkan yang baru
}

type CreateBookSubmissionRequest struct {
	Title      string   `json:"title" binding:"required"`
	Authors []SubmissionItemInput `json:"authors" binding:"required,min=1"`
	Genres  []SubmissionItemInput `json:"genres" binding:"required,min=1"`
	RemoveCover *bool `json:"remove_cover"`
	PublicationYear int `json:"publication_year"`
	Synopsis   string   `json:"synopsis"`
	TotalPages int      `json:"total_pages"`
	Language   string   `json:"language"`
	ISBN       string   `json:"isbn"`
	UserNote   string   `json:"user_note"`
}

type BookSubmissionResponse struct {
	ID        uint   `json:"id"`
	Title     string `json:"title"`
	Status    string `json:"status"`
	CreatedAt string `json:"createdAt"`
}

type MySubmissionResponse struct {
	ID          uint      `json:"id"`
	Title       string    `json:"title"`
	Status      string    `json:"status"`
	// --- UBAH MENJADI POINTER ---
	CoverImgURL *string   `json:"coverImgUrl"`
	TotalPages  *int      `json:"totalPages,omitempty"`
	Language    *string   `json:"language,omitempty"`
	ISBN        *string   `json:"isbn,omitempty"`
	UserNote    *string   `json:"userNote"`
	AdminNote   *string   `json:"adminNote"`
	PublicationYear *int16 `json:"publicationYear,omitempty"`
	// ----------------------------
	Authors     []string  `json:"authors"`
	Genres      []string  `json:"genres"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}