package gamification

import (
	"backend-bebu/internal/models"
	"gorm.io/gorm"
)

func SeedUserRanking(db *gorm.DB) {
    var userLevels []models.UserLevel

    db.Order("total_exp desc").Find(&userLevels)

    rank := 1

    for _, ul := range userLevels {
        ranking := models.UserRanking{
            UserID:     ul.UserID,
            GlobalRank: rank,
        }

        db.FirstOrCreate(&ranking, models.UserRanking{UserID: ul.UserID})

        rank++
    }
}