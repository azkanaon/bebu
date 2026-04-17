package models

type Platform struct {
	ID   uint   `gorm:"primaryKey"`
	Name string `gorm:"uniqueIndex"`
}

type UserSocialLink struct {
	ID         uint   `gorm:"primaryKey"`
	UserID     uint   `gorm:"index"`
	PlatformID uint   `gorm:"index"`
	URL        string
}

type UserCategory struct {
	UserID     uint `gorm:"primaryKey"`
	CategoryID uint `gorm:"primaryKey"`
}