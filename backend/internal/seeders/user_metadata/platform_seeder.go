package user_metadata

import (
    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedPlatforms(db *gorm.DB) {
    platforms := []models.Platform{
        {PlatformName: "Twitter", PlatformImageURL: strPtr("https://cdn-icons-png.flaticon.com/512/733/733579.png")},
        {PlatformName: "Instagram", PlatformImageURL: strPtr("https://cdn-icons-png.flaticon.com/512/733/733558.png")},
        {PlatformName: "Facebook", PlatformImageURL: strPtr("https://cdn-icons-png.flaticon.com/512/733/733547.png")},
        {PlatformName: "LinkedIn", PlatformImageURL: strPtr("https://cdn-icons-png.flaticon.com/512/733/733561.png")},
        {PlatformName: "GitHub", PlatformImageURL: strPtr("https://cdn-icons-png.flaticon.com/512/733/733553.png")},
        {PlatformName: "YouTube", PlatformImageURL: strPtr("https://cdn-icons-png.flaticon.com/512/733/733646.png")},
        {PlatformName: "TikTok", PlatformImageURL: strPtr("https://cdn-icons-png.flaticon.com/512/3046/3046121.png")},
        {PlatformName: "Medium", PlatformImageURL: strPtr("https://cdn-icons-png.flaticon.com/512/5968/5968906.png")},
    }

    for _, p := range platforms {
        db.FirstOrCreate(&p, models.Platform{PlatformName: p.PlatformName})
    }
}

func strPtr(s string) *string {
    return &s
}