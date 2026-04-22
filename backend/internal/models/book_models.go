// book_models.go
package models

import (
	"time"

	"gorm.io/gorm"
)

type Book struct {
	BookID           uint           `gorm:"column:book_id;primaryKey;autoIncrement"`
	PublicID         string         `gorm:"column:public_id;type:uuid;default:gen_random_uuid();unique;not null"`
	Title            string         `gorm:"column:title;size:255;not null"`
	Synopsis         string        `gorm:"column:synopsis;type:text"`
	CoverImgURL      string        `gorm:"column:cover_img_url;type:text"`
	PublicationYear  int16         `gorm:"column:publication_year"`
	Language         string        `gorm:"column:language;size:50"`
	TotalPages       int           `gorm:"column:total_pages"`
	Slug             string        `gorm:"column:slug;size:255"`
	CreatedAt        time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt        time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt        gorm.DeletedAt `gorm:"column:deleted_at;index"`

	// Relations
	Authors []Author `gorm:"many2many:books_authors;joinForeignKey:BookID;joinReferences:AuthorID"`
	Genres  []Genre  `gorm:"many2many:books_genres;joinForeignKey:BookID;joinReferences:GenreID"`
}


// ==============================
// ✍️ AUTHOR
// ==============================

type Author struct {
	AuthorID   uint           `gorm:"column:author_id;primaryKey;autoIncrement"`
	PublicID   string         `gorm:"column:public_id;type:uuid;default:gen_random_uuid();unique;not null"`
	AuthorName string         `gorm:"column:author_name;size:200;not null"`
	Slug       string         `gorm:"column:slug;size:220;unique;not null"`
	CreatedAt  time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt  time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt  gorm.DeletedAt `gorm:"column:deleted_at;index"`

	// Relations
	Books []Book `gorm:"many2many:books_authors;joinForeignKey:AuthorID;joinReferences:BookID"`
}


// ==============================
// 🎭 GENRE
// ==============================

type Genre struct {
	GenreID    uint           `gorm:"column:genre_id;primaryKey;autoIncrement"`
	GenreName  string         `gorm:"column:genre_name;size:30;not null"`
	Slug       string         `gorm:"column:slug;size:30;unique;not null"`
	CreatedAt  time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt  time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt  gorm.DeletedAt `gorm:"column:deleted_at;index"`

	// Relations
	Books []Book `gorm:"many2many:books_genres;joinForeignKey:GenreID;joinReferences:BookID"`
}


// ==============================
// 🔗 BOOKS_AUTHORS (JUNCTION)
// ==============================

type BookAuthor struct {
	BookID    uint      `gorm:"column:book_id;primaryKey"`
	AuthorID  uint      `gorm:"column:author_id;primaryKey"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime"`

	Book   Book   `gorm:"foreignKey:BookID;references:BookID"`
	Author Author `gorm:"foreignKey:AuthorID;references:AuthorID"`
}


// ==============================
// 🔗 BOOKS_GENRES (JUNCTION)
// ==============================

type BookGenre struct {
	BookID    uint      `gorm:"column:book_id;primaryKey"`
	GenreID   uint      `gorm:"column:genre_id;primaryKey"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime"`

	Book  Book  `gorm:"foreignKey:BookID;references:BookID"`
	Genre Genre `gorm:"foreignKey:GenreID;references:GenreID"`
}