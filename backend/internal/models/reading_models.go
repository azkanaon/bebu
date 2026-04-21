// reading_models.go
package models

import "time"

type UserBookshelf struct {
	UserBookshelfID uint      `gorm:"column:user_bookshelf_id;primaryKey;autoIncrement"`
	PublicID        string    `gorm:"column:public_id;type:uuid;default:gen_random_uuid();unique;not null"`
	UserID          uint      `gorm:"column:user_id;not null;index:idx_bookshelves_user_id"`
	BookID          uint      `gorm:"column:book_id;not null;index:idx_bookshelves_book_id"`
	ShelfStatus     string    `gorm:"column:shelf_status;size:50;not null;default:want_to_read"`
	ProgressPercent *int      `gorm:"column:progress_percent"`
	StartedAt       *time.Time `gorm:"column:started_at"`
	FinishedAt      *time.Time `gorm:"column:finished_at"`
	Notes           *string   `gorm:"column:notes;type:text"`
	UpdatedAt       time.Time `gorm:"column:updated_at;autoUpdateTime"`

	// Relations
	User User `gorm:"foreignKey:UserID;references:UserID"`
	Book Book `gorm:"foreignKey:BookID;references:BookID"`
}

type ReadingWrap struct {
	ReadingWrapID         uint      `gorm:"column:reading_wrap_id;primaryKey;autoIncrement"`
	PublicID              string    `gorm:"column:public_id;type:uuid;default:gen_random_uuid();unique;not null"`
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
	ReadingActivityLogID uint      `gorm:"column:reading_activity_log_id;primaryKey;autoIncrement"`
	UserID               uint      `gorm:"column:user_id;not null;uniqueIndex:idx_reading_activity_user_date"`
	TotalValue           int       `gorm:"column:total_value;not null;default:0"`
	Date                 time.Time `gorm:"column:date;type:date;not null;uniqueIndex:idx_reading_activity_user_date"`

	// Relations
	User User `gorm:"foreignKey:UserID;references:UserID"`
}