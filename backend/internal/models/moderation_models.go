package models

import (
	"time"
)

type Report struct {
	ID         uint      `gorm:"primaryKey"`
	ReporterID uint      `gorm:"index"`
	TargetType string    // post, comment, user
	TargetID   uint
	Reason     string
	CreatedAt  time.Time
}

type AdminAction struct {
	ID        uint      `gorm:"primaryKey"`
	AdminID   uint      `gorm:"index"`
	Action    string
	TargetType string
	TargetID  uint
	CreatedAt time.Time
}