package user_metadata

import (
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedUserCategories(db *gorm.DB) {
    var users []models.User
    var categories []models.Category

    db.Find(&users)
    db.Find(&categories)

    rand.Seed(time.Now().UnixNano())

    for _, user := range users {
        favCount := rand.Intn(4) + 2 // 2–5 kategori

        used := make(map[uint]bool)

        for i := 0; i < favCount; i++ {
            cat := categories[rand.Intn(len(categories))]

            if used[cat.CategoryID] {
                continue
            }

            uc := models.UserCategory{
                UserID:     user.UserID,
                CategoryID: cat.CategoryID,
            }

            db.FirstOrCreate(
                &uc,
                models.UserCategory{
                    UserID:     user.UserID,
                    CategoryID: cat.CategoryID,
                },
            )

            used[cat.CategoryID] = true
        }
    }
}