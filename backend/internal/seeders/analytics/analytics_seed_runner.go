package analytics

import "gorm.io/gorm"

func Run(db *gorm.DB) {
    SeedSearchLogs(db)
}