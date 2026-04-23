package chat

import (
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedMessageReads(db *gorm.DB) {
    var messages []models.Message
    var members []models.ConversationMember

    db.Find(&messages)
    db.Find(&members)

    rand.Seed(time.Now().UnixNano())

    for _, msg := range messages {

        for _, m := range members {

            if m.ConversationID != msg.ConversationID {
                continue
            }

            // sender pasti read
            if m.UserID == msg.SenderUserID || rand.Intn(2) == 0 {

                read := models.MessageRead{
                    MessageID: msg.MessageID,
                    UserID:    m.UserID,
                    ReadAt:    msg.CreatedAt.Add(time.Duration(rand.Intn(10)) * time.Minute),
                }

                db.FirstOrCreate(&read, read)
            }
        }
    }
}