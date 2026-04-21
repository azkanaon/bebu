// taxonomy_models.go
package models

import "time"

type Category struct {
	CategoryID         uint      `gorm:"column:category_id;primaryKey;autoIncrement"`
	CategoryName       string    `gorm:"column:category_name;size:100;not null"`
	CategoryNormalized string    `gorm:"column:category_normalized;size:100;not null"`
	UsageCount         int       `gorm:"column:usage_count;not null;default:0"`
	CreatedAt          time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt          time.Time `gorm:"column:updated_at;autoUpdateTime"`
}