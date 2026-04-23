package post

import "gorm.io/gorm"

func Run(db *gorm.DB) {
    SeedPosts(db)
}