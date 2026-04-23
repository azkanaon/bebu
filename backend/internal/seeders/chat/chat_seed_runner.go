package chat

import "gorm.io/gorm"

func Run(db *gorm.DB) {
    SeedConversations(db)
    SeedMessages(db)
    SeedMessageReads(db)
    UpdateLastReadMessage(db)
}