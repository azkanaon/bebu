package booksubmission

import (
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedBookSubmissionAuthors(db *gorm.DB) {
    var submissions []models.BookSubmission
    var authors []models.Author

    db.Find(&submissions)
    db.Find(&authors)

    rand.Seed(time.Now().UnixNano())

    for _, s := range submissions {

        count := rand.Intn(2) + 1 // 1–2 author

        used := make(map[uint]bool)

        for i := 0; i < count; i++ {
            a := authors[rand.Intn(len(authors))]

            if used[a.AuthorID] {
                continue
            }

            rel := models.BookSubmissionAuthor{
                BookSubmissionID: s.BookSubmissionID,
                AuthorID:         a.AuthorID,
                CreatedAt:        time.Now(),
            }

            db.FirstOrCreate(&rel, rel)

            used[a.AuthorID] = true
        }
    }
}