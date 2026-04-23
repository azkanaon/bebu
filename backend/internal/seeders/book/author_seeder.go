package book

import (
    "strings"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func slugify(s string) string {
    return strings.ToLower(strings.ReplaceAll(s, " ", "-"))
}

func SeedAuthors(db *gorm.DB) {
    authors := []string{
        "J.K. Rowling",
        "Masashi Kishimoto",
        "Eiichiro Oda",
        "Tere Liye",
        "Andrea Hirata",
        "Pramoedya Ananta Toer",
        "Agatha Christie",
        "Stephen King",
        "George R.R. Martin",
        "J.R.R. Tolkien",
        "Haruki Murakami",
        "Dewi Lestari",
        "Raditya Dika",
        "Mark Manson",
        "Yuval Noah Harari",
    }

    for _, name := range authors {
        a := models.Author{
            AuthorName: name,
            Slug:       slugify(name),
        }

        db.FirstOrCreate(&a, models.Author{Slug: a.Slug})
    }
}