package post_interaction

import (
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedPostSaves(db *gorm.DB) {
    var users []models.User
    var posts []models.Post

    db.Find(&users)
    db.Find(&posts)

    rand.Seed(time.Now().UnixNano())

    for _, post := range posts {
        saveCount := rand.Intn(8)

        used := make(map[uint]bool)

        for i := 0; i < saveCount; i++ {
            user := users[rand.Intn(len(users))]

            if used[user.UserID] {
                continue
            }

            save := models.PostSave{
                PostID: post.PostID,
                UserID: user.UserID,
            }

            db.FirstOrCreate(&save, save)
            used[user.UserID] = true
        }
    }
}