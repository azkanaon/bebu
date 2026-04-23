package moderation

import (
	"backend-bebu/internal/models"
	"time"

	"gorm.io/gorm"
)

func strPtr(s string) *string { return &s }
func intPtr(i int) *int       { return &i }

func SeedAdminActions(db *gorm.DB) {
	now := time.Now()

	actions := []models.AdminAction{
		// 🚫 USER MODERATION
		{
			AdminID:    1,
			ActionType: "ban_user",
			EntityType: strPtr("user"),
			EntityID:   intPtr(3),
			Reason:     strPtr("Spam berulang dan promosi ilegal"),
			DurationDays: intPtr(7),
			CreatedAt:  now.Add(-72 * time.Hour),
		},
		{
			AdminID:    1,
			ActionType: "suspend_user",
			EntityType: strPtr("user"),
			EntityID:   intPtr(5),
			Reason:     strPtr("Perilaku toxic di komentar"),
			DurationDays: intPtr(3),
			CreatedAt:  now.Add(-48 * time.Hour),
		},
		{
			AdminID:    10,
			ActionType: "warn_user",
			EntityType: strPtr("user"),
			EntityID:   intPtr(8),
			Reason:     strPtr("Konten borderline melanggar aturan"),
			CreatedAt:  now.Add(-24 * time.Hour),
		},

		// 📝 POST MODERATION
		{
			AdminID:    1,
			ActionType: "delete_post",
			EntityType: strPtr("post"),
			EntityID:   intPtr(12),
			Reason:     strPtr("Mengandung ujaran kebencian"),
			CreatedAt:  now.Add(-36 * time.Hour),
		},
		{
			AdminID:    10,
			ActionType: "flag_post",
			EntityType: strPtr("post"),
			EntityID:   intPtr(15),
			Reason:     strPtr("Diduga plagiarisme"),
			CreatedAt:  now.Add(-20 * time.Hour),
		},
		{
			AdminID:    1,
			ActionType: "restore_post",
			EntityType: strPtr("post"),
			EntityID:   intPtr(12),
			Reason:     strPtr("Banding diterima, konten valid"),
			CreatedAt:  now.Add(-10 * time.Hour),
		},

		// ⚠️ MIXED CASE
		{
			AdminID:    10,
			ActionType: "ban_user",
			EntityType: strPtr("user"),
			EntityID:   intPtr(14),
			Reason:     strPtr("Akun bot terdeteksi"),
			DurationDays: intPtr(30),
			CreatedAt:  now.Add(-6 * time.Hour),
		},
		{
			AdminID:    1,
			ActionType: "delete_post",
			EntityType: strPtr("post"),
			EntityID:   intPtr(21),
			Reason:     strPtr("Spam link berbahaya"),
			CreatedAt:  now.Add(-3 * time.Hour),
		},
		{
			AdminID:    10,
			ActionType: "warn_user",
			EntityType: strPtr("user"),
			EntityID:   intPtr(2),
			Reason:     strPtr("Melanggar aturan ringan"),
			CreatedAt:  now.Add(-1 * time.Hour),
		},
	}

	for _, action := range actions {
		db.Create(&action)
	}
}