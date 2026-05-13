package dto

import "time"

type UpdateFavoriteItemDTO struct {
	ItemID uint  `json:"itemId" binding:"required"` // badge_id atau achievement_id
	Order  int16 `json:"order" binding:"required,min=1,max=4"`
}

// BadgeDTO merepresentasikan satu badge yang telah diperoleh user.
// Ini adalah gabungan data dari user_badges dan badges.
type BadgeDTO struct {
	BadgeID      uint   `json:"badgeId"`
	BadgeName    string `json:"badgeName"`
	LogoURL      string `json:"logoUrl"`
	Description  string `json:"description"`
	DisplayOrder *int16 `json:"displayOrder,omitempty"`
}

// AchievementDTO merepresentasikan satu achievement yang telah diperoleh user.
// Ini adalah gabungan data dari user_achievements dan achievements.
type AchievementDTO struct {
	AchievementID     uint   `json:"achievementId"`
	AchievementName string    `json:"achievementName"`
	LogoURL         string    `json:"logoUrl"`
	Description     string    `json:"description"`
	EarnedAt        time.Time `json:"earnedAt"`
	DisplayOrder    *int16    `json:"displayOrder,omitempty"`
}