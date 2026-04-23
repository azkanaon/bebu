package gamification

import (
    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedBadges(db *gorm.DB) {
    badges := []models.Badge{
        {BadgeName: "Book Explorer", BadgeTier: strPtr("bronze"), TotalExp: 100},
        {BadgeName: "Avid Reader", BadgeTier: strPtr("silver"), TotalExp: 300},
        {BadgeName: "Master Reviewer", BadgeTier: strPtr("gold"), TotalExp: 600},
        {BadgeName: "Discussion Starter", BadgeTier: strPtr("bronze"), TotalExp: 150},
        {BadgeName: "Community Builder", BadgeTier: strPtr("silver"), TotalExp: 400},
        {BadgeName: "Top Contributor", BadgeTier: strPtr("gold"), TotalExp: 800},
    }

    for _, b := range badges {
        db.FirstOrCreate(&b, models.Badge{BadgeName: b.BadgeName})
    }
}

func strPtr(s string) *string {
    return &s
}