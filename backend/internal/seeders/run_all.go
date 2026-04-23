package seeders

import (
    "backend-bebu/internal/seeders/taxonomy"
    "backend-bebu/internal/seeders/user_metadata"
    "backend-bebu/internal/seeders/user"
    "backend-bebu/internal/seeders/user_social"
    "backend-bebu/internal/seeders/book"
    "backend-bebu/internal/seeders/post"
    "backend-bebu/internal/seeders/post_interaction"
    "backend-bebu/internal/seeders/analytics"
    "backend-bebu/internal/seeders/gamification"
    "backend-bebu/internal/seeders/moderation"
    "backend-bebu/internal/seeders/chat"
    "backend-bebu/internal/seeders/reading"
    "backend-bebu/internal/seeders/book_submission"
    "gorm.io/gorm"
)

func RunAll(db *gorm.DB) {
    user.Run(db)
    user_social.Run(db)
    taxonomy.Run(db)
    user_metadata.Run(db)
    book.Run(db)
    post.Run(db)
    post_interaction.Run(db)
    analytics.Run(db)
    gamification.Run(db)
    moderation.Run(db)
    chat.Run(db)
    reading.Run(db)
    booksubmission.Run(db)
}