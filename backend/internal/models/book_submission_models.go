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
	BookSubmissionID uint `gorm:"column:book_submission_id;primaryKey"`

	SubmittedByUserID uint `gorm:"column:submitted_by_user_id;not null"`
	ReviewedByUserID  *uint `gorm:"column:reviewed_by_user_id"`

	BookID *uint `gorm:"column:book_id"`

	Title      string `gorm:"column:title;size:255;not null"`
	TotalPages int    `gorm:"column:total_pages"`
	Language   string `gorm:"column:language;size:100"`
	ISBN       string `gorm:"column:isbn;size:20"`

	Synopsis   string `gorm:"column:synopsis;type:text"`
	CoverImgURL string `gorm:"column:cover_img_url;type:text"`

	UserNote  string `gorm:"column:user_note;type:text"`
	AdminNote string `gorm:"column:admin_note;type:text"`

	Status BookSubmissionStatus `gorm:"column:status;size:30;default:pending"`

	ReviewedAt *time.Time `gorm:"column:reviewed_at"`

	CreatedAt time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index"`

	// Relasi
	SubmittedByUser User  `gorm:"foreignKey:SubmittedByUserID"`
	ReviewedByUser  *User `gorm:"foreignKey:ReviewedByUserID"`

	Book *Book `gorm:"foreignKey:BookID"`

	Authors []BookSubmissionAuthor `gorm:"foreignKey:BookSubmissionID"`
}

type BookSubmissionAuthor struct {
	BookSubmissionAuthorID uint `gorm:"column:book_submission_author_id;primaryKey"`

	BookSubmissionID uint `gorm:"column:book_submission_id;not null"`

	AuthorName string `gorm:"column:author_name;size:200;not null"`

	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime"`

	// Relasi
	BookSubmission BookSubmission `gorm:"foreignKey:BookSubmissionID"`
}