package gamification

import (
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedUserLevels(db *gorm.DB) {
    var users []models.User
    var levels []models.LevelMaster

    db.Find(&users)
    db.Order("level_number asc").Find(&levels)

    rand.Seed(time.Now().UnixNano())

    for _, user := range users {
        // skew ke level rendah (realistic)
        levelIndex := int(rand.ExpFloat64()*3) % len(levels)
        level := levels[levelIndex]

        totalExp := rand.Intn(level.MaxTotalExp-level.MinTotalExp) + level.MinTotalExp

        currentExp := totalExp - level.MinTotalExp
        nextExp := level.MaxTotalExp - totalExp

        ul := models.UserLevel{
            UserID:          user.UserID,
            LevelMasterID:   level.LevelMasterID,
            TotalExp:        totalExp,
            CurrentLevelExp: currentExp,
            NextLevelExp:    nextExp,
            LastLevelUpAt:   randomPastTime(),
        }

        db.FirstOrCreate(&ul, models.UserLevel{UserID: user.UserID})
    }
}