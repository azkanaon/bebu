package post_interaction

import (
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedPostShares(db *gorm.DB) {
    var users []models.User
    var posts []models.Post

    db.Find(&users)
    db.Find(&posts)

    rand.Seed(time.Now().UnixNano())

    for _, post := range posts {
        shareCount := rand.Intn(5)

        for i := 0; i < shareCount; i++ {
            sender := users[rand.Intn(len(users))]
            receiver := users[rand.Intn(len(users))]

            if sender.UserID == receiver.UserID {
                continue
            }

            share := models.PostShare{
                PostID:         post.PostID,
                UserSenderID:   sender.UserID,
                UserReceiverID: receiver.UserID,
            }

            db.FirstOrCreate(&share, models.PostShare{
                PostID:         post.PostID,
                UserSenderID:   sender.UserID,
                UserReceiverID: receiver.UserID,
            })
        }
    }
}