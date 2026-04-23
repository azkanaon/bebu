package gamification

import (
	"math/rand"
	"time"

	"backend-bebu/internal/models"
	"gorm.io/gorm"
)

func SeedUserAchievements(db *gorm.DB) {
	var users []models.User
	var achievements []models.Achievement

	db.Find(&users)
	db.Find(&achievements)

	rand.Seed(time.Now().UnixNano())

	for _, user := range users {
		for _, a := range achievements {

			if rand.Intn(4) != 0 {
				continue
			}

			progress := rand.Intn(100)

			ua := models.UserAchievement{
				UserID:          user.UserID,
				AchievementID:   a.AchievementID,
				ProgressPercent: progress,
			}

			if progress == 100 {
				ua.EarnedAt = randomPastTime()
			}

			db.FirstOrCreate(&ua, models.UserAchievement{
				UserID:        user.UserID,
				AchievementID: a.AchievementID,
			})
		}
	}
}
