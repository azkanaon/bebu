package user_metadata

import (
    "fmt"
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedUserSocialLinks(db *gorm.DB) {
    var users []models.User
    var platforms []models.Platform

    db.Find(&users)
    db.Find(&platforms)

    rand.Seed(time.Now().UnixNano())

    for _, user := range users {
        linkCount := rand.Intn(3) + 1 // 1–3 link

        usedPlatform := make(map[uint]bool)

        for i := 0; i < linkCount; i++ {
            platform := platforms[rand.Intn(len(platforms))]

            // hindari duplicate platform per user
            if usedPlatform[platform.PlatformID] {
                continue
            }

            url := generateSocialURL(platform.PlatformName, user.Username)

            link := models.UserSocialLink{
                UserID:     user.UserID,
                PlatformID: platform.PlatformID,
                SocialURL:  url,
            }

            db.FirstOrCreate(
                &link,
                models.UserSocialLink{
                    UserID:     user.UserID,
                    PlatformID: platform.PlatformID,
                },
            )

            usedPlatform[platform.PlatformID] = true
        }
    }
}

func generateSocialURL(platform, username string) string {
    switch platform {
    case "Twitter":
        return fmt.Sprintf("https://twitter.com/%s", username)
    case "Instagram":
        return fmt.Sprintf("https://instagram.com/%s", username)
    case "Facebook":
        return fmt.Sprintf("https://facebook.com/%s", username)
    case "LinkedIn":
        return fmt.Sprintf("https://linkedin.com/in/%s", username)
    case "GitHub":
        return fmt.Sprintf("https://github.com/%s", username)
    case "YouTube":
        return fmt.Sprintf("https://youtube.com/@%s", username)
    case "TikTok":
        return fmt.Sprintf("https://tiktok.com/@%s", username)
    case "Medium":
        return fmt.Sprintf("https://medium.com/@%s", username)
    default:
        return fmt.Sprintf("https://%s.com/%s", platform, username)
    }
}