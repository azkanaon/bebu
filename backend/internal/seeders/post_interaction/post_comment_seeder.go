package post_interaction

import (
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedPostComments(db *gorm.DB) {
    var users []models.User
    var posts []models.Post

    db.Find(&users)
    db.Find(&posts)

    commentsText := []string{
        "Review-nya bagus banget, jadi pengen baca bukunya!",
        "Saya kurang setuju di bagian akhir.",
        "Penjelasannya detail dan mudah dipahami.",
        "Ini salah satu buku favorit saya juga.",
        "Insight-nya dalam banget 🔥",
    }

    rand.Seed(time.Now().UnixNano())

    for _, post := range posts {
        commentCount := rand.Intn(6) // 0–5 komentar utama

        var parentComments []models.PostComment

        for i := 0; i < commentCount; i++ {
            user := users[rand.Intn(len(users))]

            comment := models.PostComment{
                PostID:  post.PostID,
                UserID:  user.UserID,
                Comment: commentsText[rand.Intn(len(commentsText))],
            }

            db.Create(&comment)
            parentComments = append(parentComments, comment)
        }

        // replies
        for _, parent := range parentComments {
            replyCount := rand.Intn(3)

            for i := 0; i < replyCount; i++ {
                user := users[rand.Intn(len(users))]

                reply := models.PostComment{
                    PostID:          post.PostID,
                    UserID:          user.UserID,
                    Comment:         "Balasan: " + commentsText[rand.Intn(len(commentsText))],
                    ParentCommentID: &parent.PostCommentID,
                }

                db.Create(&reply)
            }
        }
    }
}