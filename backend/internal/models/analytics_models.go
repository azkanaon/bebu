package models

import (
	"time"
)

type SearchLog struct {
	SearchLogID     uint      `gorm:"column:search_log_id;primaryKey;autoIncrement"`
	UserID          *uint     `gorm:"column:user_id"`
	QueryText       string    `gorm:"column:query_text;type:text;not null"`
	QueryNormalized string    `gorm:"column:query_normalized;type:text;not null;index:idx_search_logs_normalized"`
	CreatedAt       time.Time `gorm:"column:created_at;autoCreateTime"`

	// Relations
	User *User `gorm:"foreignKey:UserID;references:UserID"`
}