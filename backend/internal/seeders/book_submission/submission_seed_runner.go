package booksubmission

import "gorm.io/gorm"

func Run(db *gorm.DB) {
    SeedBookSubmissions(db)
    SeedBookSubmissionAuthors(db)
}