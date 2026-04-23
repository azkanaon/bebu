package user_metadata

import "gorm.io/gorm"

func Run(db *gorm.DB) {
    SeedPlatforms(db)
    SeedUserSocialLinks(db)
    SeedUserCategories(db)
}