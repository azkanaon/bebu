package models

import (
	"time"
)

type SearchLog struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    uint      `gorm:"index"`
	Query     string
	CreatedAt time.Time
}