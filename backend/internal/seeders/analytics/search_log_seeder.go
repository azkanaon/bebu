package analytics

import (
    "math/rand"
    "strings"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func normalize(q string) string {
    return strings.ToLower(strings.TrimSpace(q))
}

func generateFollowUpQuery(base string) string {
    suffix := []string{
        "review lengkap",
        "ringkasan",
        "pdf",
        "harga",
        "author",
    }

    return base + " " + suffix[rand.Intn(len(suffix))]
}

func getUserCategoryPreferences(userID uint, userCats []models.UserCategory, categories []models.Category) []string {
    var result []string

    for _, uc := range userCats {
        if uc.UserID == userID {
            for _, c := range categories {
                if c.CategoryID == uc.CategoryID {
                    result = append(result, c.CategoryName)
                }
            }
        }
    }

    return result
}

func realisticTime() time.Time {
    now := time.Now()

    // skew ke recent time (lebih realistis)
    hoursAgo := rand.ExpFloat64() * 48 // exponential decay

    return now.Add(-time.Duration(hoursAgo) * time.Hour)
}

func injectTypo(s string) string {
    if len(s) < 4 {
        return s
    }

    i := rand.Intn(len(s) - 1)
    chars := []rune(s)
    chars[i], chars[i+1] = chars[i+1], chars[i]

    return string(chars)
}

func generateQueryVariant(base string, prefs []string) string {
    variants := []string{
        base,
        "review " + base,
        base + " review",
        "buku " + base,
        base + " terbaik",
        "rekomendasi " + base,
        base + " summary",
    }

    // inject preference
    if len(prefs) > 0 && rand.Intn(3) == 0 {
        pref := prefs[rand.Intn(len(prefs))]
        variants = append(variants, pref+" "+base)
    }

    result := variants[rand.Intn(len(variants))]

    // typo injection
    if rand.Intn(6) == 0 {
        result = injectTypo(result)
    }

    return result
}

func SeedSearchLogs(db *gorm.DB) {
    var users []models.User
    var books []models.Book
    var categories []models.Category
    var userCategories []models.UserCategory

    db.Find(&users)
    db.Find(&books)
    db.Find(&categories)
    db.Find(&userCategories)

    rand.Seed(time.Now().UnixNano())

    // ===== base query pool =====
    baseQueries := []string{
        "harry potter",
        "naruto",
        "one piece",
        "sapiens",
        "laskar pelangi",
        "atomic habits",
        "buku bisnis terbaik",
        "novel indonesia",
        "buku filsafat",
        "self improvement",
        "manga terbaik",
        "buku sejarah dunia",
    }

    totalLogs := 200

    for i := 0; i < totalLogs; i++ {

        var userID *uint
        var userPref []string

        // ===== 70% logged in =====
        if rand.Intn(10) < 7 {
            u := users[rand.Intn(len(users))]
            userID = &u.UserID

            userPref = getUserCategoryPreferences(u.UserID, userCategories, categories)
        }

        // ===== pilih base query =====
        base := baseQueries[rand.Intn(len(baseQueries))]

        // ===== generate variasi =====
        query := generateQueryVariant(base, userPref)

        log := models.SearchLog{
            UserID:          userID,
            QueryText:       query,
            QueryNormalized: normalize(query),
            CreatedAt:       realisticTime(),
        }

        db.Create(&log)

        // ===== simulate session burst =====
        if rand.Intn(5) == 0 {
            for j := 0; j < rand.Intn(3)+1; j++ {
                followUp := generateFollowUpQuery(query)

                db.Create(&models.SearchLog{
                    UserID:          userID,
                    QueryText:       followUp,
                    QueryNormalized: normalize(followUp),
                    CreatedAt:       realisticTime(),
                })
            }
        }
    }
}