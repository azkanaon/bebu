package dto

import "time"

// NoteDTO merepresentasikan satu catatan.
type NoteDTO struct {
	ID          uint   `json:"id"`
	Type        string    `json:"type"`
	PageStart   *int   `json:"pageStart,omitempty"`
	PageEnd     *int   `json:"pageEnd,omitempty"`
	Description string `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
}

// BookshelfDetailDTO merepresentasikan data detail dari satu entri rak buku.
type BookshelfDetailDTO struct {
	PublicID    string          `json:"publicId"`
	Book        BookSummaryDTO  `json:"book"`
	ShelfStatus string          `json:"shelfStatus"`
	Progress    int             `json:"progress"`
	CurrentPage int            `json:"currentPage,omitempty"`
	StartedAt   *time.Time      `json:"startedAt,omitempty"`
	FinishedAt  *time.Time      `json:"finishedAt,omitempty"`
	Notes       []NoteDTO       `json:"notes"` // <-- Array untuk menampung catatan
}

type AddNoteRequestDTO struct {
	Type        string `json:"type" binding:"required,oneof=insight quote summary"`
	PageStart   *int   `json:"page_start,omitempty"`
	PageEnd     *int   `json:"page_end,omitempty"`
	Description string `json:"description" binding:"required,min=1"`
}

type UpdateNoteRequestDTO struct {
	PageStart   *int   `json:"page_start,omitempty"`
	PageEnd     *int   `json:"page_end,omitempty"`
	Description *string `json:"description,omitempty" binding:"omitempty,min=1"`
}