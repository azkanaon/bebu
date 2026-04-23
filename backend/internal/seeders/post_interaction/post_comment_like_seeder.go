package post_interaction

import (
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedPostCommentLikes(db *gorm.DB) {
    var users []models.User
    var comments []models.PostComment

    db.Find(&users)
    db.Find(&comments)

    rand.Seed(time.Now().UnixNano())

    for _, c := range comments {
        likeCount := rand.Intn(5)

        used := make(map[uint]bool)

        for i := 0; i < likeCount; i++ {
            user := users[rand.Intn(len(users))]

            if used[user.UserID] {
                continue
            }

            like := models.PostCommentLike{
                PostCommentID: c.PostCommentID,
                UserID:        user.UserID,
            }

            db.FirstOrCreate(&like, like)
            used[user.UserID] = true
        }
    }
}