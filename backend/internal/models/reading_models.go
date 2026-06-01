// reading_models.go
package models

import (
	"time"
	"github.com/google/uuid"
)

type UserBookshelf struct {
	UserBookshelfID uint      `gorm:"column:user_bookshelf_id;primaryKey"`
	PublicID        uuid.UUID `gorm:"column:public_id;type:uuid;default:gen_random_uuid();unique;not null"`
	UserID          uint      `gorm:"column:user_id;not null;index"`
	BookID          uint      `gorm:"column:book_id;not null"`
	ShelfStatus     string    `gorm:"column:shelf_status;size:50;not null;default:want_to_read"`
	CurrentPage     int `gorm:"column:current_page;not null;default:0"`
	ProgressPercent *int      `gorm:"column:progress_percent"`
	StartedAt       *time.Time `gorm:"column:started_at"`
	FinishedAt      *time.Time `gorm:"column:finished_at"`
	UpdatedAt       time.Time `gorm:"column:updated_at;autoUpdateTime"`

	// --- RELASI KELUAR ---
	User User `gorm:"foreignKey:UserID;references:UserID"`
	Book Book `gorm:"foreignKey:BookID;references:BookID"`

	Notes []Note `gorm:"foreignKey:UserBookshelfID;references:UserBookshelfID"`
}

type ReadingWrap struct {
	ReadingWrapID         uint      `gorm:"column:reading_wrap_id;primaryKey;autoIncrement"`
	PublicID              uuid.UUID `gorm:"column:public_id;type:uuid;default:gen_random_uuid();unique;not null"`
	UserID                uint      `gorm:"column:user_id;not null"`
	TopAuthorID           *uint     `gorm:"column:top_author_id"`
	TopGenreID            *uint     `gorm:"column:top_genre_id"`
	TopBookID             *uint     `gorm:"column:top_book_id"`
	Year                  int16     `gorm:"column:year;not null"`
	TotalPagesRead        int       `gorm:"column:total_pages_read;not null;default:0"`
	TotalBooksRead        int       `gorm:"column:total_books_read;not null;default:0"`
	TotalLikesReceived    int       `gorm:"column:total_likes_received;not null;default:0"`
	TotalReviewsRead      int       `gorm:"column:total_reviews_read;not null;default:0"`
	TotalCommentsWritten  int       `gorm:"column:total_comments_written;not null;default:0"`
	GeneratedAt           time.Time `gorm:"column:generated_at;autoCreateTime"`

	// Relations
	User      User    `gorm:"foreignKey:UserID;references:UserID"`
	TopAuthor *Author `gorm:"foreignKey:TopAuthorID;references:AuthorID"`
	TopGenre  *Genre  `gorm:"foreignKey:TopGenreID;references:GenreID"`
	TopBook   *Book   `gorm:"foreignKey:TopBookID;references:BookID"`
}

type ReadingActivityLog struct {
	ReadingActivityLogID uint      `gorm:"primaryKey"`
	UserID               uint      `gorm:"not null;uniqueIndex:idx_user_date"` // Bagian dari composite unique index
	TotalValue           int       `gorm:"not null;default:0"`
	TotalLikes           int       `gorm:"not null;default:0"`
	TotalComments        int       `gorm:"not null;default:0"`
	TotalPosts           int       `gorm:"not null;default:0"`
	TotalNotes           int       `gorm:"not null;default:0"`

	Date                 time.Time `gorm:"type:date;not null;uniqueIndex:idx_user_date"`

	User User `gorm:"foreignKey:UserID"`
}

// Note merepresentasikan tabel 'notes' di database.
type Note struct {
	NoteID           uint      `gorm:"primaryKey"`
	UserBookshelfID uint      `gorm:"not null;index"` // Foreign key ke user_bookshelves
	Type             string    `gorm:"column:type;size:20;not null;default:insight"`
	PageStart        *int      // Pointer ke int agar bisa NULL
	PageEnd          *int      // Pointer ke int agar bisa NULL
	Description      string    `gorm:"type:text;not null"`
	CreatedAt        time.Time `gorm:"autoCreateTime"`
	UpdatedAt        time.Time `gorm:"autoUpdateTime"`

	// Relasi: Sebuah catatan dimiliki oleh satu entri di rak buku.
	UserBookshelf UserBookshelf `gorm:"foreignKey:UserBookshelfID;references:UserBookshelfID"`
}

type UserReadingStat struct {
	UserID           uint      `gorm:"primaryKey"`
	CurrentStreak    int       `gorm:"not null;default:0"`
	LongestStreak    int       `gorm:"not null;default:0"`
	LastActivityDate *time.Time `gorm:"type:date"`
	UpdatedAt        time.Time `gorm:"autoUpdateTime"`
}