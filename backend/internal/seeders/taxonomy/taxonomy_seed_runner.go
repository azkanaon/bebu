package taxonomy

import "gorm.io/gorm"

func Run(db *gorm.DB) {
    SeedCategories(db)
}