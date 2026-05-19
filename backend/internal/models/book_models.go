// book_models.go
package models

import (
	"time"

	"gorm.io/gorm"
)

type Book struct {
	BookID          uint           `gorm:"column:book_id;primaryKey"`
	PublicID        string         `gorm:"column:public_id;type:uuid;default:gen_random_uuid();unique;not null"`
	Title           string         `gorm:"column:title;size:255;not null"`
	Synopsis        string         `gorm:"column:synopsis;type:text"`
	CoverImgURL     string         `gorm:"column:cover_img_url;type:text"`
	GoogleBookID 	string `gorm:"column:google_book_id;size:255;unique"`
	PublicationYear int16          `gorm:"column:publication_year"`
	Language        string         `gorm:"column:language;size:50"`
	TotalPages      int            `gorm:"column:total_pages"`
	Slug            string         `gorm:"column:slug;size:255"` 
	CreatedAt       time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt       time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt       gorm.DeletedAt `gorm:"column:deleted_at;index"`

	// Relasi
	BookAuthors []BookAuthor 	`gorm:"foreignKey:BookID"`
	BookGenres  []BookGenre  	`gorm:"foreignKey:BookID"`
	Posts       []Post       	`gorm:"foreignKey:BookID"`
	BookStat 	BookStat 	 	`gorm:"foreignKey:BookID"`
	DailyStats  []BookDailyStat `gorm:"foreignKey:BookID"`
}

type Author struct {
	AuthorID   uint           `gorm:"column:author_id;primaryKey"`
	PublicID   string         `gorm:"column:public_id;type:uuid;default:gen_random_uuid();unique;not null"`
	AuthorName string         `gorm:"column:author_name;size:200;not null"`
	Slug       string         `gorm:"column:slug;size:220;unique;not null"`
	CreatedAt  time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt  time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt  gorm.DeletedAt `gorm:"column:deleted_at;index"`

	// Relasi: Penulis ini ada di banyak entri BookAuthor
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

	// --- RELASI KELUAR (UNTUK PRELOAD BERTINGKAT) ---
	Author Author `gorm:"foreignKey:AuthorID"`
    Book   Book   `gorm:"foreignKey:BookID"`
}

type BookGenre struct {
	BookID    uint      `gorm:"column:book_id;primaryKey"`
	GenreID   uint      `gorm:"column:genre_id;primaryKey"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime"`

	Book  Book  `gorm:"foreignKey:BookID;references:BookID"`
	Genre Genre `gorm:"foreignKey:GenreID;references:GenreID"`
}

type BookStat struct {
	BookID        uint      `gorm:"column:book_id;primaryKey"`
	OverallRating float32   `gorm:"column:overall_rating;type:numeric(3,2);default:0.00"`
	TotalRatingSum int      `gorm:"column:total_rating_sum;default:0"`
	TotalReviews  int       `gorm:"column:total_reviews;default:0"`
	TotalPosts    int       `gorm:"column:total_posts;default:0"`
	
	Rating1Count  int       `gorm:"column:rating_1_count;default:0"`
	Rating2Count  int       `gorm:"column:rating_2_count;default:0"`
	Rating3Count  int       `gorm:"column:rating_3_count;default:0"`
	Rating4Count  int       `gorm:"column:rating_4_count;default:0"`
	Rating5Count  int       `gorm:"column:rating_5_count;default:0"`

	UpdatedAt     time.Time `gorm:"column:updated_at;autoUpdateTime"`
	
	Book          *Book     `gorm:"foreignKey:BookID;constraint:OnDelete:CASCADE;"`
}

type BookDailyStat struct {
	ID         uint      `gorm:"primaryKey;column:id"`
	BookID     uint      `gorm:"column:book_id;not null;uniqueIndex:idx_book_date"`
	Date       time.Time `gorm:"type:date;not null;uniqueIndex:idx_book_date"`
	TotalPosts int       `gorm:"column:total_posts;default:0;not null"`
	CreatedAt  time.Time `gorm:"not null"`
	UpdatedAt  time.Time `gorm:"not null"`

	Book          *Book     `gorm:"foreignKey:BookID;constraint:OnDelete:CASCADE;"`
}