package models

import (
	"time"
)

// =====================
// Category Model (master)
// =====================
type Category struct {
	CategoryID        uint           `gorm:"primaryKey;column:category_id"`
	CategoryName      string         `gorm:"column:category_name"`
	CategoryNormalized string        `gorm:"column:category_normalized"`
	UsageCount        int            `gorm:"column:usage_count"`

	CreatedAt         time.Time      `gorm:"column:created_at"`
	UpdatedAt         time.Time      `gorm:"column:updated_at"`

	// Relations
	PostCategories []*PostCategory `gorm:"foreignKey:CategoryID"`
	UserCategories []*UserCategory `gorm:"foreignKey:CategoryID"`
}