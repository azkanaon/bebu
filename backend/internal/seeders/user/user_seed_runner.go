package user

import "gorm.io/gorm"

func Run(db *gorm.DB) {
    SeedUsers(db)
    SeedUserProfiles(db)
    SeedUserSettings(db)
}