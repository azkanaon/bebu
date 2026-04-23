package user

import (
    "backend-bebu/internal/models"
    "gorm.io/gorm"
)

func SeedUserProfiles(db *gorm.DB) {
    var users []models.User
    db.Find(&users)

    bios := []string{
        "Software engineer yang suka ngopi ☕",
        "UI/UX designer, pecinta warna pastel 🎨",
        "Backend developer, Go enthusiast 🚀",
        "Mahasiswa IT, lagi belajar fullstack",
        "Content creator & tech reviewer",
    }

    for i, user := range users {
        profile := models.UserProfile{
            UserID:      user.UserID,
            DisplayName: user.Username,
            Bio:         bios[i%len(bios)],
            AvatarUrl:   "https://i.pravatar.cc/150?img=" + string(rune(65+i)),
            Gender:      []string{"male", "female"}[i%2],
            Location:    []string{"Jakarta", "Bandung", "Surabaya", "Yogyakarta"}[i%4],
        }

        db.FirstOrCreate(&profile, models.UserProfile{UserID: user.UserID})
    }
}