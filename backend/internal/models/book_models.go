package models

import "time"

// ==============================
// 📚 BOOK
// ==============================

type Book struct {
	BookID         uint       `gorm:"primaryKey;column:book_id"`
	PublicID       string     `gorm:"column:public_id"`
	Title          string     `gorm:"column:title"`
	Synopsis       string     `gorm:"column:synopsis"`
	CoverImgURL    string     `gorm:"column:cover_img_url"`
	PublicationYear int       `gorm:"column:publication_year"`
	Language       string     `gorm:"column:language"`
	TotalPages     int        `gorm:"column:total_pages"`
	Slug           string     `gorm:"column:slug"`
	CreatedAt      time.Time  `gorm:"column:created_at"`
	UpdatedAt      time.Time  `gorm:"column:updated_at"`
	DeletedAt      *time.Time `gorm:"column:deleted_at"`

	// 🔗 Relations
	Authors []Author `gorm:"many2many:books_authors;joinForeignKey:BookID;joinReferences:AuthorID"`
	Genres  []Genre  `gorm:"many2many:books_genres;joinForeignKey:BookID;joinReferences:GenreID"`
}


// ==============================
// ✍️ AUTHOR
// ==============================

type Author struct {
	AuthorID  uint       `gorm:"primaryKey;column:author_id"`
	PublicID  string     `gorm:"column:public_id"`
	AuthorName string    `gorm:"column:author_name"`
	Slug      string     `gorm:"column:slug"`
	CreatedAt time.Time  `gorm:"column:created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at"`
	DeletedAt *time.Time `gorm:"column:deleted_at"`

	// 🔗 Relations
	Books []Book `gorm:"many2many:books_authors;joinForeignKey:AuthorID;joinReferences:BookID"`
}


// ==============================
// 🎭 GENRE
// ==============================

type Genre struct {
	GenreID   uint       `gorm:"primaryKey;column:genre_id"`
	GenreName string     `gorm:"column:genre_name"`
	Slug      string     `gorm:"column:slug"`
	CreatedAt time.Time  `gorm:"column:created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at"`
	DeletedAt *time.Time `gorm:"column:deleted_at"`

	// 🔗 Relations
	Books []Book `gorm:"many2many:books_genres;joinForeignKey:GenreID;joinReferences:BookID"`
}


// ==============================
// 🔗 BOOKS_AUTHORS (JUNCTION)
// ==============================

type BookAuthor struct {
	BookID   uint      `gorm:"column:book_id"`
	AuthorID uint      `gorm:"column:author_id"`
	CreatedAt time.Time `gorm:"column:created_at"`
}


// ==============================
// 🔗 BOOKS_GENRES (JUNCTION)
// ==============================

type BookGenre struct {
	BookID   uint      `gorm:"column:book_id"`
	GenreID  uint      `gorm:"column:genre_id"`
	CreatedAt time.Time `gorm:"column:created_at"`
}