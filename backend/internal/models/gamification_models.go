package models

import (
	"time"
)

type LevelMaster struct {
	ID        uint `gorm:"primaryKey"`
	Level     int
	MinExp    int
}

type UserLevel struct {
	UserID uint `gorm:"primaryKey"`
	Level  int
	Exp    int
}

type ExpTransaction struct {
	ID     uint `gorm:"primaryKey"`
	UserID uint `gorm:"index"`
	Amount int
	Reason string
}

type Badge struct {
	ID   uint   `gorm:"primaryKey"`
	Name string
}

type Achievement struct {
	ID   uint   `gorm:"primaryKey"`
	Name string
}

type UserBadge struct {
	UserID  uint `gorm:"primaryKey"`
	BadgeID uint `gorm:"primaryKey"`
}

type UserAchievement struct {
	UserID        uint `gorm:"primaryKey"`
	AchievementID uint `gorm:"primaryKey"`
}

type UserRanking struct {
	UserID     uint      `gorm:"column:user_id;primaryKey"`
	GlobalRank int       `gorm:"column:global_rank"`
	UpdatedAt  time.Time `gorm:"column:updated_at;autoUpdateTime"`

	// Relasi ke tabel users
	User User `gorm:"foreignKey:UserID;references:UserID"`
}