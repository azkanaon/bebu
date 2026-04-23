package post_interaction

import (
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedPostLikes(db *gorm.DB) {
    var users []models.User
    var posts []models.Post

    db.Find(&users)
    db.Find(&posts)

    rand.Seed(time.Now().UnixNano())

    for _, post := range posts {
        likeCount := rand.Intn(15) // 0–15 likes

        used := make(map[uint]bool)

        for i := 0; i < likeCount; i++ {
            user := users[rand.Intn(len(users))]

            if used[user.UserID] {
                continue
            }

            like := models.PostLike{
                PostID: post.PostID,
                UserID: user.UserID,
            }

            db.FirstOrCreate(&like, like)
            used[user.UserID] = true
        }
    }
}