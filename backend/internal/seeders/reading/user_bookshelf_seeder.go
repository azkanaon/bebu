package reading

import (
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func randomPastTime() time.Time {
    now := time.Now()
    return now.Add(-time.Duration(rand.Intn(30*24)) * time.Hour)
}

func SeedUserBookshelves(db *gorm.DB) {
    var users []models.User
    var books []models.Book

    db.Find(&users)
    db.Find(&books)

    rand.Seed(time.Now().UnixNano())

    statuses := []string{"want_to_read", "reading", "completed"}

    for _, user := range users {

        bookCount := rand.Intn(8) + 3 // tiap user 3–10 buku

        used := make(map[uint]bool)

        for i := 0; i < bookCount; i++ {
            b := books[rand.Intn(len(books))]

            if used[b.BookID] {
                continue
            }

            status := statuses[rand.Intn(len(statuses))]

            shelf := models.UserBookshelf{
                UserID:      user.UserID,
                BookID:      b.BookID,
                ShelfStatus: status,
                UpdatedAt:   time.Now(),
            }

            // ===== logic status =====
            switch status {

            case "reading":
                p := rand.Intn(90) + 1
                shelf.ProgressPercent = &p

                started := randomPastTime()
                shelf.StartedAt = &started

            case "completed":
                p := 100
                shelf.ProgressPercent = &p

                start := randomPastTime()
                finish := start.Add(time.Duration(rand.Intn(10)+1) * 24 * time.Hour)

                shelf.StartedAt = &start
                shelf.FinishedAt = &finish

            case "want_to_read":
                // kosong (sesuai real case)
            }

            // notes optional
            if rand.Intn(3) == 0 {
                note := "Menarik, mau dibaca nanti."
                shelf.Notes = &note
            }

            db.Create(&shelf)
            used[b.BookID] = true
        }
    }
}