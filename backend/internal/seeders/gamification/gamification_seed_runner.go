package gamification

import "gorm.io/gorm"

func Run(db *gorm.DB) {
    SeedLevelMasters(db)
    SeedUserLevels(db)
    SeedExpTransactions(db)

    SeedBadges(db)
    SeedAchievements(db)
    SeedUserBadges(db)
    SeedUserAchievements(db)
    SeedUserRanking(db)
}