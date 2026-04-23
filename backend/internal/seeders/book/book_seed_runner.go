package book

import "gorm.io/gorm"

func Run(db *gorm.DB) {
    SeedAuthors(db)
    SeedGenres(db)
    SeedBooks(db)
}