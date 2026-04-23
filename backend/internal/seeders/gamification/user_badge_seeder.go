package gamification

import (
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedUserBadges(db *gorm.DB) {
    var users []models.User
    var badges []models.Badge

    db.Find(&users)
    db.Find(&badges)

    rand.Seed(time.Now().UnixNano())

    for _, user := range users {
        for _, badge := range badges {

            if rand.Intn(3) != 0 {
                continue // tidak semua user punya badge
            }

            progress := rand.Intn(100)

            ub := models.UserBadge{
                UserID:          user.UserID,
                BadgeID:         badge.BadgeID,
                ProgressPercent: progress,
            }

            if progress == 100 {
                ub.EarnedAt = randomPastTime()
            }

            db.FirstOrCreate(&ub, models.UserBadge{
                UserID:  user.UserID,
                BadgeID: badge.BadgeID,
            })
        }
    }
}