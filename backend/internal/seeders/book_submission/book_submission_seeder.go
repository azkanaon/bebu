package booksubmission

import (
    "math/rand"
    "time"
	"strings"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func randomPastTime() time.Time {
    now := time.Now()
    return now.Add(-time.Duration(rand.Intn(30*24)) * time.Hour)
}

func SeedBookSubmissions(db *gorm.DB) {
    var users []models.User
    db.Find(&users)

    rand.Seed(time.Now().UnixNano())

    titles := []string{
        "Atomic Habits Revisited",
        "Deep Learning for Beginners",
        "Naruto Side Stories",
        "The Hidden Life of Algorithms",
        "Philosophy of Modern AI",
        "Harry Potter: Extended Lore",
        "Clean Code Illustrated",
        "The Art of System Design",
        "Mindset Mastery",
        "Data Science in Practice",
    }

    statuses := []string{"pending", "approved", "rejected"}

    for _, user := range users {

        // tidak semua user submit
        if rand.Intn(3) != 0 {
            continue
        }

        submissionCount := rand.Intn(2) + 1

        for i := 0; i < submissionCount; i++ {

            title := titles[rand.Intn(len(titles))]
            status := statuses[rand.Intn(len(statuses))]

            submission := models.BookSubmission{
                UserID: user.UserID,
                Title:  title,
                Status: status,
                CreatedAt: randomPastTime(),
            }

            // optional fields (realistic noise)
            if rand.Intn(2) == 0 {
                lang := pickLanguage()
                submission.Language = &lang
            }

            if rand.Intn(2) == 0 {
                pages := rand.Intn(400) + 100
                submission.TotalPages = &pages
            }

            if rand.Intn(2) == 0 {
                url := "https://example.com/covers/" + slugify(title) + ".jpg"
                submission.CoverImgURL = &url
            }

            db.Create(&submission)
        }
    }
}

func pickLanguage() string {
    langs := []string{"English", "Indonesian", "Japanese"}
    return langs[rand.Intn(len(langs))]
}

func slugify(s string) string {
    return strings.ToLower(strings.ReplaceAll(s, " ", "-"))
}