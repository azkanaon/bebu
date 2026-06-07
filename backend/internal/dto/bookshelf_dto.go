package dto

import (
	"math"
	"time"
)
type BookshelfContextDTO struct {
	Title       string   `json:"title"`
	Authors     []string `json:"authors"`
	CoverImgURL string   `json:"coverImgUrl"`
	Progress    int      `json:"progress"`
	CurrentPage int      `json:"currentPage"`
	TotalPages  int      `json:"totalPages"`
	ShelfStatus string   `json:"shelfStatus"`
}

// Response utama untuk endpoint notes
type BookshelfNotesResponseDTO struct {
	Bookshelf BookshelfContextDTO `json:"bookshelf"`
	Data      []NoteDTO           `json:"data"`
	Meta      *PaginationDTO      `json:"meta"`
}
// BookshelfItemDTO merepresentasikan satu item buku di rak pengguna.
type BookshelfItemDTO struct {
	ID          uint            `json:"id"`
	PublicID    string          `json:"publicId"` // Public ID dari entri bookshelf
	Book        BookSummaryDTO  `json:"book"`
	ShelfStatus string          `json:"shelfStatus"`
	Progress    int             `json:"progress"` // ProgressPercent
	CurrentPage int 			`json:"currentPage"`
	StartedAt   *time.Time      `json:"startedAt,omitempty"`
	FinishedAt  *time.Time      `json:"finishedAt,omitempty"`
}

// BookSummaryDTO adalah representasi ringkas dari sebuah buku.
type BookSummaryDTO struct {
	PublicID    string   `json:"publicId"` // Public ID dari buku
	Title       string   `json:"title"`
	CoverImgURL string   `json:"coverImgUrl"`
	TotalPages  int      `json:"totalPages"`
	Authors     []string `json:"authors"` // Hanya daftar nama penulis
}

// PaginationDTO berisi metadata yang dibutuhkan oleh frontend untuk render paginasi.
type PaginationDTO struct {
	CurrentPage int   `json:"currentPage"`
	PageSize    int   `json:"pageSize"`
	TotalPages  int   `json:"totalPages"`
	TotalItems  int64 `json:"totalItems"`
}

// NewPaginationDTO adalah fungsi helper untuk membuat DTO paginasi dengan mudah.
func NewPaginationDTO(totalItems int64, page, limit int) *PaginationDTO {
	if limit <= 0 {
		limit = 1 // Mencegah pembagian dengan nol
	}
	totalPages := int(math.Ceil(float64(totalItems) / float64(limit)))

	return &PaginationDTO{
		CurrentPage: page,
		PageSize:    limit,
		TotalPages:  totalPages,
		TotalItems:  totalItems,
	}
}

type AddToBookshelfRequestDTO struct {
	GoogleBookID    string   `json:"google_book_id" binding:"required"`
	Title           string   `json:"title" binding:"required"`
	Authors         []string `json:"authors" binding:"required"`
	Genres          []string `json:"genres"`
	Synopsis        string   `json:"synopsis"`
	CoverImgURL     string   `json:"cover_img_url"`
	TotalPages      int      `json:"total_pages"`
	PublicationYear int16    `json:"publication_year"`
	Language        string   `json:"language"`
	ShelfStatus     string   `json:"shelf_status" binding:"required,oneof=want_to_read reading done"`
}

type UpdateBookshelfRequestDTO struct {
	ShelfStatus     *string `json:"shelf_status,omitempty" binding:"omitempty,oneof=want_to_read reading done"`
	ProgressPercent *int    `json:"progress_percent,omitempty" binding:"omitempty,min=0,max=100"`
	CurrentPage     *int    `json:"current_page" binding:"omitempty,min=0"`
}

type ReadingStatsDTO struct {
	CurrentStreak    int        `json:"currentStreak"`
	LongestStreak    int        `json:"longestStreak"`
	LastActivityDate *time.Time `json:"lastActivityDate"`
}

