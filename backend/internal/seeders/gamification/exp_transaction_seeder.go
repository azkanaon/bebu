package gamification

import (
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func randomPastTime() time.Time {
    now := time.Now()
    return now.Add(-time.Duration(rand.Intn(30*24)) * time.Hour)
}

func SeedExpTransactions(db *gorm.DB) {
    var users []models.User
    var posts []models.Post
    var comments []models.PostComment

    db.Find(&users)
    db.Find(&posts)
    db.Find(&comments)

    rand.Seed(time.Now().UnixNano())

    sources := []string{"post", "comment", "like"}

    for _, user := range users {
        txCount := rand.Intn(10) + 5

        for i := 0; i < txCount; i++ {
            sourceType := sources[rand.Intn(len(sources))]

            var sourceID *uint

            switch sourceType {
            case "post":
                p := posts[rand.Intn(len(posts))]
                sourceID = &p.PostID
            case "comment":
                c := comments[rand.Intn(len(comments))]
                sourceID = &c.PostCommentID
            case "like":
                p := posts[rand.Intn(len(posts))]
                sourceID = &p.PostID
            }

            exp := generateExp(sourceType)

            tx := models.ExpTransaction{
                UserID:     user.UserID,
                SourceID:   sourceID,
                SourceType: sourceType,
                ExpAmount:  exp,
                CreatedAt:  randomPastTime(),
            }

            db.Create(&tx)
        }
    }
}

func generateExp(source string) int {
    switch source {
    case "post":
        return rand.Intn(50) + 50   // 50–100
    case "comment":
        return rand.Intn(20) + 10   // 10–30
    case "like":
        return rand.Intn(5) + 1     // 1–5
    default:
        return 5
    }
}