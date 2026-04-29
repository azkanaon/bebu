package user

import (
	"backend-bebu/internal/models"

	"gorm.io/gorm"
)

func SeedUserSettings(db *gorm.DB) {
    var users []models.User
    db.Find(&users)

    for i, user := range users {
        setting := models.UserSettings{
            UserID:              user.UserID,
            IsProfilePublic:           i%5 == 0, // beberapa private
            ShowActivityHeatmap: true,
            AllowDmFromPublic:   i%3 != 0,
        }

        db.FirstOrCreate(&setting, models.UserSettings{UserID: user.UserID})
    }
}