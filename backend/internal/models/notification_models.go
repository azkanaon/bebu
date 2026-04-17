package models

import (
	"time"
)

type Notification struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    uint      `gorm:"index"`
	Type      string
	Data      string
	IsRead    bool
	CreatedAt time.Time
}