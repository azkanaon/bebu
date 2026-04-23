package reading

import (
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedReadingWrap(db *gorm.DB) {
    var users []models.User
    var books []models.Book
    var authors []models.Author
    var genres []models.Genre

    db.Find(&users)
    db.Find(&books)
    db.Find(&authors)
    db.Find(&genres)

    rand.Seed(time.Now().UnixNano())

    year := int16(time.Now().Year())

    for _, user := range users {

        totalBooks := rand.Intn(10) + 1
        totalPages := totalBooks * (rand.Intn(300) + 100)

        wrap := models.ReadingWrap{
            UserID:               user.UserID,
            Year:                 year,
            TotalBooksRead:       totalBooks,
            TotalPagesRead:       totalPages,
            TotalLikesReceived:   rand.Intn(200),
            TotalReviewsRead:     rand.Intn(50),
            TotalCommentsWritten: rand.Intn(40),
            GeneratedAt:          time.Now(),
        }

        // optional top entities
        if len(books) > 0 {
            b := books[rand.Intn(len(books))]
            wrap.TopBookID = &b.BookID
        }

        if len(authors) > 0 {
            a := authors[rand.Intn(len(authors))]
            wrap.TopAuthorID = &a.AuthorID
        }

        if len(genres) > 0 {
            g := genres[rand.Intn(len(genres))]
            wrap.TopGenreID = &g.GenreID
        }

        db.FirstOrCreate(&wrap, models.ReadingWrap{
            UserID: user.UserID,
            Year:   year,
        })
    }
}