package models

import (
	"time"

	"gorm.io/gorm"
)

type BookSubmissionStatus string

const (
	BookSubmissionPending       BookSubmissionStatus = "pending"
	BookSubmissionApproved      BookSubmissionStatus = "approved"
	BookSubmissionRejected      BookSubmissionStatus = "rejected"
	BookSubmissionDuplicate     BookSubmissionStatus = "duplicate"
	BookSubmissionNeedsRevision BookSubmissionStatus = "needs_revision"
)

type BookSubmission struct {
	BookSubmissionID   uint           `gorm:"primaryKey;column:book_submission_id"`
	SubmittedByUserID  uint           `gorm:"column:submitted_by_user_id;not null"`
	ReviewedByUserID   *uint          `gorm:"column:reviewed_by_user_id"` // Sudah pointer (NULL)
	BookID             *uint          `gorm:"column:book_id"`             // Sudah pointer (NULL)
	
	Title              string         `gorm:"column:title;size:255;not null"`
	// --- UBAH MENJADI POINTER ---
	TotalPages         *int           `gorm:"column:total_pages"`
	Language           *string        `gorm:"column:language;size:100"`
	ISBN               *string        `gorm:"column:isbn;size:20"`
	Synopsis           *string        `gorm:"column:synopsis;type:text"`
	CoverImgURL        *string        `gorm:"column:cover_img_url;type:text"`
	UserNote           *string        `gorm:"column:user_note;type:text"`
	AdminNote          *string        `gorm:"column:admin_note;type:text"`
	// ----------------------------

	Status             string         `gorm:"column:status;size:30;default:pending"`
	ReviewedAt         *time.Time     `gorm:"column:reviewed_at"`
	CreatedAt          time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt          time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt          gorm.DeletedAt `gorm:"column:deleted_at;index"`

	// Relasi tetap sama
	SubmissionAuthors  []BookSubmissionAuthor `gorm:"foreignKey:BookSubmissionID"`
	SubmissionGenres   []BookSubmissionGenre  `gorm:"foreignKey:BookSubmissionID"`
}

type BookSubmissionAuthor struct {
	BookSubmissionAuthorID uint      `gorm:"primaryKey;column:book_submission_author_id"`
	BookSubmissionID       uint      `gorm:"column:book_submission_id;not null"`
	AuthorID               *uint     `gorm:"column:author_id"`   // Pointer agar bisa NULL
	AuthorName             *string   `gorm:"column:author_name"` // Pointer agar bisa NULL
	CreatedAt              time.Time `gorm:"column:created_at;autoCreateTime"`

	// --- TAMBAHKAN RELASI INI ---
	// Ini menghubungkan ke tabel 'authors' utama menggunakan 'AuthorID'
	Author                 Author    `gorm:"foreignKey:AuthorID;references:AuthorID"`
}

type BookSubmissionGenre struct {
	BookSubmissionGenreID uint      `gorm:"primaryKey;column:book_submission_genre_id"`
	BookSubmissionID      uint      `gorm:"column:book_submission_id;not null"`
	GenreID               *uint     `gorm:"column:genre_id"`
	GenreName             *string   `gorm:"column:genre_name"`
	CreatedAt             time.Time `gorm:"column:created_at;autoCreateTime"`

	// --- TAMBAHKAN RELASI INI ---
	// Ini menghubungkan ke tabel 'genres' utama menggunakan 'GenreID'
	Genre                  Genre     `gorm:"foreignKey:GenreID;references:GenreID"`
}