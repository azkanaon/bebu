package user_social

import (
	"fmt"
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedUserFollows(db *gorm.DB) {
    var users []models.User
    db.Find(&users)

    rand.Seed(time.Now().UnixNano())

    followMap := make(map[string]bool)

    for _, user := range users {
        followCount := rand.Intn(3) + 2 // 2–4 follow

        for i := 0; i < followCount; i++ {
            target := users[rand.Intn(len(users))]

            // Hindari follow diri sendiri
            if user.UserID == target.UserID {
                continue
            }

            key := generateKey(user.UserID, target.UserID)
            if followMap[key] {
                continue
            }

            follow := models.UserFollow{
                UserFollowingID: user.UserID,
                UserFollowedID:  target.UserID,
                FollowingStatus: pickFollowStatus(),
            }

            db.FirstOrCreate(
                &follow,
                models.UserFollow{
                    UserFollowingID: user.UserID,
                    UserFollowedID:  target.UserID,
                },
            )

            followMap[key] = true
        }
    }
}

func generateKey(a, b uint) string {
    return fmt.Sprintf("%d-%d", a, b)
}

func pickFollowStatus() string {
    if rand.Intn(5) == 0 {
        return "pending"
    }
    return "accepted"
}