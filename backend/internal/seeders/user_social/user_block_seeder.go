package user_social

import (
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedUserBlocks(db *gorm.DB) {
    var users []models.User
    db.Find(&users)

    rand.Seed(time.Now().UnixNano())

    blockMap := make(map[string]bool)

    for _, user := range users {
        // hanya sebagian kecil user yang block orang
        if rand.Intn(4) != 0 {
            continue
        }

        blockCount := rand.Intn(2) + 1 // 1–2 block

        for i := 0; i < blockCount; i++ {
            target := users[rand.Intn(len(users))]

            if user.UserID == target.UserID {
                continue
            }

            key := generateKey(user.UserID, target.UserID)
            if blockMap[key] {
                continue
            }

            block := models.UserBlock{
                UserBlockingID: user.UserID,
                UserBlockedID:  target.UserID,
            }

            db.FirstOrCreate(
                &block,
                models.UserBlock{
                    UserBlockingID: user.UserID,
                    UserBlockedID:  target.UserID,
                },
            )

            blockMap[key] = true
        }
    }
}