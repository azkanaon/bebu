package models

import (
	"time"
)

type BookSubmission struct {
	ID          uint      `gorm:"primaryKey"`
	UserID      uint      `gorm:"index"`
	Title       string
	Description string
	Status      string    // pending, approved, rejected
	CreatedAt   time.Time
}

type BookSubmissionAuthor struct {
	SubmissionID uint `gorm:"primaryKey"`
	AuthorName   string `gorm:"primaryKey"`
}