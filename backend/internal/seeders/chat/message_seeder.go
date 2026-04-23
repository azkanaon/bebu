package chat

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

func SeedMessages(db *gorm.DB) {
    var convos []models.Conversation
    var posts []models.Post

    db.Preload("Members").Find(&convos)
    db.Find(&posts)

    rand.Seed(time.Now().UnixNano())

    messagesText := []string{
        "Lagi baca buku ini, bagus banget!",
        "Menurut kamu gimana ending-nya?",
        "Ini recommended sih",
        "Gue kurang suka bagian tengahnya",
        "Worth it buat dibaca",
    }

    for _, c := range convos {

        msgCount := rand.Intn(15) + 5

        var lastTime time.Time

        for i := 0; i < msgCount; i++ {

            sender := c.Members[rand.Intn(len(c.Members))]

            msgType := pickMessageType()

            var body *string
            var postID *uint

            if msgType == "text" {
                text := messagesText[rand.Intn(len(messagesText))]
                body = &text
            } else {
                p := posts[rand.Intn(len(posts))]
                postID = &p.PostID
            }

            created := randomPastTime()

            msg := models.Message{
                ConversationID: c.ConversationID,
                SenderUserID:   sender.UserID,
                MessageType:    msgType,
                Body:           body,
                PostID:         postID,
                CreatedAt:      created,
            }

            db.Create(&msg)

            if created.After(lastTime) {
                lastTime = created
            }
        }

        db.Model(&c).Update("last_message_at", lastTime)
    }
}

func pickMessageType() string {
    if rand.Intn(5) == 0 {
        return "post"
    }
    return "text"
}

func UpdateLastReadMessage(db *gorm.DB) {
    var members []models.ConversationMember

    db.Find(&members)

    for _, m := range members {
        var lastRead models.MessageRead

        db.Where("user_id = ?", m.UserID).
            Order("message_id desc").
            First(&lastRead)

        if lastRead.MessageID != 0 {
            db.Model(&m).Update("last_read_message_id", lastRead.MessageID)
        }
    }
}