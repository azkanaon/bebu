package gamification

import (
    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedLevelMasters(db *gorm.DB) {
    levels := []models.LevelMaster{}

    minExp := 0
    increment := 100

    for i := 1; i <= 20; i++ {
        maxExp := minExp + increment

        level := models.LevelMaster{
            LevelNumber: i,
            MinTotalExp: minExp,
            MaxTotalExp: maxExp,
        }

        levels = append(levels, level)

        minExp = maxExp + 1
        increment += 50 // naik bertahap
    }

    for _, l := range levels {
        db.FirstOrCreate(&l, models.LevelMaster{LevelNumber: l.LevelNumber})
    }
}