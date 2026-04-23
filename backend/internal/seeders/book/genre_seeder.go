package book

import (
    "strings"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedGenres(db *gorm.DB) {
    genres := []string{
        "Fantasy",
        "Adventure",
        "Mystery",
        "Thriller",
        "Romance",
        "Horror",
        "Science Fiction",
        "Drama",
        "Comedy",
        "Slice of Life",
        "Action",
        "Historical",
        "Self Improvement",
        "Biography",
        "Philosophy",
    }

    for _, g := range genres {
        genre := models.Genre{
            GenreName: g,
            Slug:      strings.ToLower(strings.ReplaceAll(g, " ", "-")),
        }

        db.FirstOrCreate(&genre, models.Genre{Slug: genre.Slug})
    }
}