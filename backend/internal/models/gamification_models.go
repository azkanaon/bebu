// gamification_models.go
package models

import (
	"time"
)

type LevelMaster struct {
	LevelMasterID uint      `gorm:"column:level_master_id;primaryKey;autoIncrement"`
	LevelNumber   int       `gorm:"column:level_number;unique;not null"`
	MinTotalExp   int       `gorm:"column:min_total_exp;not null"`
	MaxTotalExp   int       `gorm:"column:max_total_exp;not null"`
	CreatedAt     time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt     time.Time `gorm:"column:updated_at;autoUpdateTime"`
}

type UserLevel struct {
	UserID           uint      `gorm:"column:user_id;primaryKey"`
	LevelMasterID    uint      `gorm:"column:level_master_id;not null"`
	TotalExp         int       `gorm:"column:total_exp;not null;default:0"`
	CurrentLevelExp  int       `gorm:"column:current_level_exp;not null;default:0"`
	NextLevelExp     int       `gorm:"column:next_level_exp;not null;default:0"`
	LastLevelUpAt    time.Time `gorm:"column:last_level_up_at;autoCreateTime"`
	UpdatedAt        time.Time `gorm:"column:updated_at;autoUpdateTime"`

	User        User        `gorm:"foreignKey:UserID;references:UserID"`
	LevelMaster LevelMaster `gorm:"foreignKey:LevelMasterID;references:LevelMasterID"`
}

type ExpTransaction struct {
	ExpTransactionID uint      `gorm:"column:exp_transaction_id;primaryKey;autoIncrement"`
	UserID           uint      `gorm:"column:user_id;not null"`
	SourceID         *uint     `gorm:"column:source_id"`
	SourceType       string    `gorm:"column:source_type;size:50;not null"`
	ExpAmount        int       `gorm:"column:exp_amount;not null"`
	CreatedAt        time.Time `gorm:"column:created_at;autoCreateTime"`

	User User `gorm:"foreignKey:UserID;references:UserID"`
}

type Badge struct {
	BadgeID     uint      `gorm:"column:badge_id;primaryKey;autoIncrement"`
	BadgeName   string    `gorm:"column:badge_name;size:150;not null"`
	Description *string   `gorm:"column:description;type:text"`
	LogoURL     *string   `gorm:"column:logo_url;type:text"`
	BadgeTier   *string   `gorm:"column:badge_tier;size:20"`
	TotalExp    int       `gorm:"column:total_exp;not null;default:0"`
	CreatedAt   time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt   time.Time `gorm:"column:updated_at;autoUpdateTime"`

	Achievements []Achievement `gorm:"foreignKey:BadgeID"`
}

type Achievement struct {
	AchievementID   uint      `gorm:"column:achievement_id;primaryKey;autoIncrement"`
	BadgeID         *uint     `gorm:"column:badge_id"`
	AchievementName string    `gorm:"column:achievement_name;size:150;not null"`
	Description     *string   `gorm:"column:description;type:text"`
	LogoURL         *string   `gorm:"column:logo_url;type:text"`
	CriteriaValue   *int      `gorm:"column:criteria_value"`
	TotalExp        int       `gorm:"column:total_exp;not null;default:0"`
	CreatedAt       time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt       time.Time `gorm:"column:updated_at;autoUpdateTime"`

	Badge *Badge `gorm:"foreignKey:BadgeID;references:BadgeID"`
}

type UserBadge struct {
	UserID          uint      `gorm:"column:user_id;primaryKey"`
	BadgeID         uint      `gorm:"column:badge_id;primaryKey"`
	EarnedAt        time.Time `gorm:"column:earned_at;autoCreateTime"`
	ProgressPercent int       `gorm:"column:progress_percent;not null;default:0"`
	CreatedAt       time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt       time.Time `gorm:"column:updated_at;autoUpdateTime"`

	User  User  `gorm:"foreignKey:UserID;references:UserID"`
	Badge Badge `gorm:"foreignKey:BadgeID;references:BadgeID"`
}

type UserAchievement struct {
	UserID          uint      `gorm:"column:user_id;primaryKey"`
	AchievementID   uint      `gorm:"column:achievement_id;primaryKey"`
	EarnedAt        time.Time `gorm:"column:earned_at;autoCreateTime"`
	ProgressPercent int       `gorm:"column:progress_percent;not null;default:0"`
	CreatedAt       time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt       time.Time `gorm:"column:updated_at;autoUpdateTime"`

	User        User        `gorm:"foreignKey:UserID;references:UserID"`
	Achievement Achievement `gorm:"foreignKey:AchievementID;references:AchievementID"`
}

type UserRanking struct {
	UserID     uint      `gorm:"column:user_id;primaryKey"`
	GlobalRank int      `gorm:"column:global_rank"`
	UpdatedAt  time.Time `gorm:"column:updated_at;autoUpdateTime"`

	User User `gorm:"foreignKey:UserID;references:UserID"`
}