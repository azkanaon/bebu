// book_models.go
package models

import (
	"time"

	"gorm.io/gorm"
)

type Book struct {
	BookID          uint           `gorm:"column:book_id;primaryKey;autoIncrement"`
	PublicID        string         `gorm:"column:public_id;type:uuid;default:gen_random_uuid();unique;not null"`
	Title           string         `gorm:"column:title;size:255;not null"`
	Synopsis        string         `gorm:"column:synopsis;type:text"`
	CoverImgURL     string         `gorm:"column:cover_img_url;type:text"`
	PublicationYear int16          `gorm:"column:publication_year"`
	Language        string         `gorm:"column:language;size:50"`
	TotalPages      int            `gorm:"column:total_pages"`
	Slug            string         `gorm:"column:slug;size:255"`
	CreatedAt       time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt       time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt       gorm.DeletedAt `gorm:"column:deleted_at;index"`

	// Relations
	BookGenres  []BookGenre  `gorm:"foreignKey:BookID;references:BookID"`
	BookAuthors []BookAuthor `gorm:"foreignKey:BookID;references:BookID"`
	Posts       []Post       `gorm:"foreignKey:BookID;references:BookID"`
}

type Author struct {
	AuthorID   uint           `gorm:"column:author_id;primaryKey;autoIncrement"`
	PublicID   string         `gorm:"column:public_id;type:uuid;default:gen_random_uuid();unique;not null"`
	AuthorName string         `gorm:"column:author_name;size:200;not null"`
	Slug       string         `gorm:"column:slug;size:220;unique;not null"`
	CreatedAt  time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt  time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt  gorm.DeletedAt `gorm:"column:deleted_at;index"`

	// Relations
	BookAuthors []BookAuthor `gorm:"foreignKey:AuthorID"`
}

type Genre struct {
	GenreID   uint           `gorm:"column:genre_id;primaryKey;autoIncrement"`
	GenreName string         `gorm:"column:genre_name;size:30;not null"`
	Slug      string         `gorm:"column:slug;size:30;unique;not null"`
	CreatedAt time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index"`

	// Relations
	BookGenres []BookGenre `gorm:"foreignKey:GenreID"`
}

type BookAuthor struct {
	BookID    uint      `gorm:"column:book_id;primaryKey"`
	AuthorID  uint      `gorm:"column:author_id;primaryKey"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime"`

	Book   Book   `gorm:"foreignKey:BookID;references:BookID"`
	Author Author `gorm:"foreignKey:AuthorID;references:AuthorID"`
}

type BookGenre struct {
	BookID    uint      `gorm:"column:book_id;primaryKey"`
	GenreID   uint      `gorm:"column:genre_id;primaryKey"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime"`

	Book  Book  `gorm:"foreignKey:BookID;references:BookID"`
	Genre Genre `gorm:"foreignKey:GenreID;references:GenreID"`
}
