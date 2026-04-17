package models

import (
	"time"
)

type UserBookshelf struct {
	ID     uint   `gorm:"primaryKey"`
	UserID uint   `gorm:"index"`
	Name   string
}

type ReadingWrap struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    uint      `gorm:"index"`
	Year      int
	CreatedAt time.Time
}

type ReadingActivityLog struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    uint      `gorm:"index"`
	BookID    uint      `gorm:"index"`
	Activity  string    // e.g. started, finished
	CreatedAt time.Time
}