package post

import (
    "math/rand"
    "time"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
    "github.com/google/uuid"
)

func SeedPosts(db *gorm.DB) {
    var users []models.User
    var books []models.Book
    var categories []models.Category

    db.Find(&users)
    db.Find(&books)
    db.Find(&categories)

    rand.Seed(time.Now().UnixNano())

    postsData := []struct {
        Title       string
        Description string
        Type        string
        Rating      float64
        Categories  []string
    }{
        {
            "Review Harry Potter",
            "Buku ini benar-benar membawa saya ke dunia sihir yang immersive. Karakter Harry berkembang dengan sangat natural.",
            "review",
            4.5,
            []string{"Anime", "Literature"},
        },
        {
            "Analisis Naruto: Perjalanan Ninja",
            "Naruto bukan sekadar manga action, tapi juga membahas kesepian, pengakuan, dan perjuangan hidup.",
            "analysis",
            0,
            []string{"Manga", "Anime"},
        },
        {
            "Review Sapiens",
            "Sapiens membuka perspektif baru tentang sejarah manusia, sangat insightful dan provokatif.",
            "review",
            4.8,
            []string{"History", "Philosophy"},
        },
        {
            "Bedah Buku Laskar Pelangi",
            "Kisah yang sangat menyentuh tentang pendidikan dan mimpi anak-anak di daerah terpencil.",
            "analysis",
            0,
            []string{"Literature", "Education"},
        },
    }

    for i := 0; i < 25; i++ {
        base := postsData[i%len(postsData)]
        user := users[rand.Intn(len(users))]
        book := books[rand.Intn(len(books))]

        post := models.Post{
            PublicID:      uuid.NewString(),
            UserID:        user.UserID,
            BookID:        book.BookID,
            Description:   base.Description,
            PostType:      base.Type,
            PublishStatus: pickStatus(),
            ImgURL:        book.CoverImgURL,
            CreatedAt:     randomTime(),
            UpdatedAt:     time.Now(),
        }

        // rating hanya untuk review
        if base.Type == "review" {
            post.Rating = base.Rating + rand.Float64()*0.5
        }

        if post.PublishStatus == "published" {
            now := randomTime()
            post.PublishedAt = now
        }

        db.Create(&post)

        // attach categories
        for _, cname := range base.Categories {
            var cat models.Category
            db.Where("category_name = ?", cname).First(&cat)

            db.Model(&post).Association("Categories").Append(&cat)
        }

        // create stat
        stat := models.PostStat{
            PostID:       post.PostID,
            LikeCount:    rand.Intn(100),
            CommentCount: rand.Intn(50),
            SaveCount:    rand.Intn(30),
            HotScore:     rand.Float64() * 100,
            UpdatedAt:    time.Now(),
        }

        db.Create(&stat)
    }
}

func pickStatus() string {
    statuses := []string{"published", "draft"}
    return statuses[rand.Intn(len(statuses))]
}

func randomTime() time.Time {
    now := time.Now()
    past := now.AddDate(0, 0, -rand.Intn(30))
    return past
}