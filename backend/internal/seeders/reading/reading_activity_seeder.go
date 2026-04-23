package reading

import (
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedReadingActivity(db *gorm.DB) {
    var users []models.User
    db.Find(&users)

    rand.Seed(time.Now().UnixNano())

    for _, user := range users {

        activeDays := rand.Intn(20) + 5 // 5–25 hari aktif

        usedDates := make(map[string]bool)

        for i := 0; i < activeDays; i++ {

            date := randomDateLast30Days()
            key := date.Format("2006-01-02")

            if usedDates[key] {
                continue
            }

            value := rand.Intn(50) + 5 // halaman dibaca

            log := models.ReadingActivityLog{
                UserID:     user.UserID,
                Date:       date,
                TotalValue: value,
            }

            db.Create(&log)
            usedDates[key] = true
        }
    }
}

func randomDateLast30Days() time.Time {
    now := time.Now()
    daysAgo := rand.Intn(30)
    return now.AddDate(0, 0, -daysAgo)
}