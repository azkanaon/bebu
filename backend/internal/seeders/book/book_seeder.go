package book

import (
    "fmt"
    "strings"

    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedBooks(db *gorm.DB) {
    var authors []models.Author
    var genres []models.Genre

    db.Find(&authors)
    db.Find(&genres)

    books := []struct {
        Title     string
        Author    string
        Genres    []string
        Year      int16
        Pages     int
        Language  string
        Synopsis  string
    }{
        {
            "Harry Potter and the Sorcerer's Stone",
            "J.K. Rowling",
            []string{"Fantasy", "Adventure"},
            1997,
            309,
            "English",
            "Seorang anak menemukan dirinya adalah penyihir dan masuk ke Hogwarts.",
        },
        {
            "Naruto Vol.1",
            "Masashi Kishimoto",
            []string{"Action", "Adventure"},
            1999,
            192,
            "Japanese",
            "Kisah ninja muda yang bercita-cita menjadi Hokage.",
        },
        {
            "One Piece Vol.1",
            "Eiichiro Oda",
            []string{"Adventure", "Action"},
            1997,
            200,
            "Japanese",
            "Petualangan Luffy menjadi Raja Bajak Laut.",
        },
        {
            "Laskar Pelangi",
            "Andrea Hirata",
            []string{"Drama", "Slice of Life"},
            2005,
            529,
            "Indonesian",
            "Perjuangan anak-anak Belitung dalam pendidikan.",
        },
        {
            "Bumi",
            "Tere Liye",
            []string{"Fantasy", "Adventure"},
            2014,
            440,
            "Indonesian",
            "Petualangan remaja dengan kekuatan dunia paralel.",
        },
        {
            "The Subtle Art of Not Giving a F*ck",
            "Mark Manson",
            []string{"Self Improvement"},
            2016,
            224,
            "English",
            "Pendekatan hidup dengan fokus pada hal yang penting.",
        },
        {
            "Sapiens",
            "Yuval Noah Harari",
            []string{"Historical", "Philosophy"},
            2011,
            498,
            "English",
            "Sejarah singkat umat manusia.",
        },
    }

    for _, b := range books {
        book := models.Book{
            Title:           b.Title,
            Synopsis:        b.Synopsis,
            CoverImgURL:     generateCoverURL(b.Title),
            PublicationYear: b.Year,
            Language:        b.Language,
            TotalPages:      b.Pages,
            Slug:            slugify(b.Title),
        }

        db.FirstOrCreate(&book, models.Book{Slug: book.Slug})

        // attach author
        var author models.Author
        db.Where("author_name = ?", b.Author).First(&author)
        db.Model(&book).Association("Authors").Append(&author)

        // attach genres
        for _, g := range b.Genres {
            var genre models.Genre
            db.Where("genre_name = ?", g).First(&genre)
            db.Model(&book).Association("Genres").Append(&genre)
        }
    }
}

func generateCoverURL(title string) string {
    return fmt.Sprintf("https://dummyimage.com/300x450/000/fff&text=%s",
        strings.ReplaceAll(title, " ", "+"))
}