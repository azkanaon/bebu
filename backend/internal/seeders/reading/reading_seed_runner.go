package reading

import "gorm.io/gorm"

func Run(db *gorm.DB) {
    SeedUserBookshelves(db)
    SeedReadingActivity(db)
    SeedReadingWrap(db)
}