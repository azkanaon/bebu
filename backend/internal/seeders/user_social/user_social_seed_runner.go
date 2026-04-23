package user_social

import "gorm.io/gorm"

func Run(db *gorm.DB) {
    SeedUserFollows(db)
    SeedUserBlocks(db)
}