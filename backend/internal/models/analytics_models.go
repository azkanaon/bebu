package models

import (
	"time"
)

type SearchLog struct {
	SearchLogID     uint      `gorm:"primaryKey;column:search_log_id"`
	UserID          uint      `gorm:"column:user_id"`
	QueryText       string    `gorm:"column:query_text;not null"`
	QueryNormalized string    `gorm:"column:query_normalized;not null"`
	CreatedAt       time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt       time.Time `gorm:"column:updated_at;autoUpdateTime"`
}