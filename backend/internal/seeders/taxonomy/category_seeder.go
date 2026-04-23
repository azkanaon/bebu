package taxonomy

import (
    "strings"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func normalize(s string) string {
    return strings.ToLower(strings.TrimSpace(s))
}

func SeedCategories(db *gorm.DB) {
    categories := []string{
        "Data Science",
        "Machine Learning",
        "Artificial Intelligence",
        "Mathematics",
        "Statistics",
        "Programming",
        "Software Engineering",
        "Cybersecurity",
        "Cloud Computing",
        "Web Development",

        "Personal Development",
        "Productivity",
        "Psychology",
        "Philosophy",
        "Business",
        "Entrepreneurship",
        "Marketing",
        "Finance",
        "Economics",
        "Leadership",

        "History",
        "Politics",
        "Education",
        "Health & Wellness",
        "Science",
        "Technology Trends",

        "Manga",
        "Anime",
        "Literature",
        "Book Review",
    }

    for _, name := range categories {
        category := models.Category{
            CategoryName:       name,
            CategoryNormalized: normalize(name),
            UsageCount:         0,
        }

        db.FirstOrCreate(
            &category,
            models.Category{CategoryNormalized: normalize(name)},
        )
    }
}