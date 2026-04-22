// user_metadata_models.go
package models

import (
	"time"

	"gorm.io/gorm"
)

type Platform struct {
	PlatformID       uint      `gorm:"column:platform_id;primaryKey;autoIncrement"`
	PublicID         string    `gorm:"column:public_id;type:uuid;default:gen_random_uuid();unique;not null"`
	PlatformName     string    `gorm:"column:platform_name;size:100;not null"`
	PlatformImageURL *string   `gorm:"column:platform_image_url;type:text"`
	CreatedAt        time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt        time.Time `gorm:"column:updated_at;autoUpdateTime"`
}

type UserSocialLink struct {
	UserSocialLinkID uint      `gorm:"column:user_social_link_id;primaryKey;autoIncrement"`
	PublicID         string    `gorm:"column:public_id;type:uuid;default:gen_random_uuid();unique;not null"`
	UserID           uint      `gorm:"column:user_id;not null"`
	PlatformID       uint      `gorm:"column:platform_id;not null"`
	SocialURL        string    `gorm:"column:social_url;size:255;not null"`
	CreatedAt        time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt        time.Time `gorm:"column:updated_at;autoUpdateTime"`

	// Relations
	User     User     `gorm:"foreignKey:UserID;references:UserID"`
	Platform Platform `gorm:"foreignKey:PlatformID;references:PlatformID"`
}

type UserCategory struct {
	UserID     uint           `gorm:"column:user_id;primaryKey;uniqueIndex:idx_user_categories_active"`
	CategoryID uint           `gorm:"column:category_id;primaryKey"`
	CreatedAt  time.Time      `gorm:"column:created_at;autoCreateTime"`
	DeletedAt  gorm.DeletedAt `gorm:"column:deleted_at;uniqueIndex:idx_user_categories_active"`

	// Relations
	User     User     `gorm:"foreignKey:UserID;references:UserID"`
	Category Category `gorm:"foreignKey:CategoryID;references:CategoryID"`
}