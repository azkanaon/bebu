package models

import (
	"time"
)

type BookSubmission struct {
	BookSubmissionID uint      `gorm:"column:book_submission_id;primaryKey;autoIncrement"`
	UserID           uint      `gorm:"column:user_id;not null"`
	CoverImgURL      *string   `gorm:"column:cover_img_url;type:text"`
	Title            string    `gorm:"column:title;size:255;not null"`
	Status           string    `gorm:"column:status;size:50;not null;default:pending"`
	Language         *string   `gorm:"column:language;size:50"`
	TotalPages       *int      `gorm:"column:total_pages"`
	CreatedAt        time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt        time.Time `gorm:"column:updated_at;autoUpdateTime"`

	// Relations
	User    User                     `gorm:"foreignKey:UserID;references:UserID"`
	Authors []BookSubmissionAuthor   `gorm:"foreignKey:BookSubmissionID"`
}

type BookSubmissionAuthor struct {
	BookSubmissionID uint      `gorm:"column:book_submission_id;primaryKey"`
	AuthorID         uint      `gorm:"column:author_id;primaryKey"`
	CreatedAt        time.Time `gorm:"column:created_at;autoCreateTime"`

	BookSubmission BookSubmission `gorm:"foreignKey:BookSubmissionID;references:BookSubmissionID"`
	Author         Author         `gorm:"foreignKey:AuthorID;references:AuthorID"`
}