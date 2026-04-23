package gamification

import (
    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedAchievements(db *gorm.DB) {
    var badges []models.Badge
    db.Find(&badges)

    achievements := []models.Achievement{}

    for _, b := range badges {
        switch b.BadgeName {

        case "Book Explorer":
            achievements = append(achievements,
                models.Achievement{BadgeID: &b.BadgeID, AchievementName: "Read 5 Books", CriteriaValue: intPtr(5), TotalExp: 50},
                models.Achievement{BadgeID: &b.BadgeID, AchievementName: "Read 10 Books", CriteriaValue: intPtr(10), TotalExp: 100},
            )

        case "Master Reviewer":
            achievements = append(achievements,
                models.Achievement{BadgeID: &b.BadgeID, AchievementName: "Write 5 Reviews", CriteriaValue: intPtr(5), TotalExp: 100},
                models.Achievement{BadgeID: &b.BadgeID, AchievementName: "Write 20 Reviews", CriteriaValue: intPtr(20), TotalExp: 250},
            )
        }
    }

    for _, a := range achievements {
        db.FirstOrCreate(&a, models.Achievement{AchievementName: a.AchievementName})
    }
}

func intPtr(i int) *int {
    return &i
}