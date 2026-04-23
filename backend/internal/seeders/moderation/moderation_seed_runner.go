package moderation

import "gorm.io/gorm"

func Run(db *gorm.DB) {
    SeedReports(db)
    SeedAdminActions(db)
}