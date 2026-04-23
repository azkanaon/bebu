package moderation

import (
	"backend-bebu/internal/models"
	"time"

	"gorm.io/gorm"
)

func uintPtr(u uint) *uint    { return &u }

func SeedReports(db *gorm.DB) {
	now := time.Now()

	reports := []models.Report{
		// 🚫 USER REPORTS (belum direview)
		{
			UserID:     2,
			EntityID:   3,
			EntityType: "user",
			ReasonText: strPtr("User ini sering spam komentar promosi"),
			CreatedAt:  now.Add(-48 * time.Hour),
		},
		{
			UserID:     4,
			EntityID:   5,
			EntityType: "user",
			ReasonText: strPtr("Menggunakan kata-kata kasar"),
			CreatedAt:  now.Add(-36 * time.Hour),
		},

		// 📝 POST REPORTS (belum direview)
		{
			UserID:     6,
			EntityID:   12,
			EntityType: "post",
			ReasonText: strPtr("Konten mengandung ujaran kebencian"),
			CreatedAt:  now.Add(-30 * time.Hour),
		},
		{
			UserID:     7,
			EntityID:   15,
			EntityType: "post",
			ReasonText: strPtr("Diduga plagiarisme dari sumber lain"),
			CreatedAt:  now.Add(-28 * time.Hour),
		},

		// ✅ SUDAH DIREVIEW (dan kemungkinan sudah ada AdminAction)
		{
			UserID:          8,
			EntityID:        3,
			EntityType:      "user",
			ReasonText:      strPtr("Spam berulang"),
			ReviewByAdminID: uintPtr(1),
			ReviewAt:        timePtr(now.Add(-24 * time.Hour)),
			CreatedAt:       now.Add(-40 * time.Hour),
		},
		{
			UserID:          9,
			EntityID:        12,
			EntityType:      "post",
			ReasonText:      strPtr("Konten ofensif"),
			ReviewByAdminID: uintPtr(1),
			ReviewAt:        timePtr(now.Add(-20 * time.Hour)),
			CreatedAt:       now.Add(-35 * time.Hour),
		},
		{
			UserID:          11,
			EntityID:        14,
			EntityType:      "user",
			ReasonText:      strPtr("Akun bot mencurigakan"),
			ReviewByAdminID: uintPtr(10),
			ReviewAt:        timePtr(now.Add(-10 * time.Hour)),
			CreatedAt:       now.Add(-18 * time.Hour),
		},

		// ⚖️ EDGE CASE (ditolak / tidak valid)
		{
			UserID:          12,
			EntityID:        2,
			EntityType:      "user",
			ReasonText:      strPtr("Tidak suka saja (tidak valid)"),
			ReviewByAdminID: uintPtr(10),
			ReviewAt:        timePtr(now.Add(-6 * time.Hour)),
			CreatedAt:       now.Add(-12 * time.Hour),
		},

		// 🔥 MASIH ANTRIAN BARU
		{
			UserID:     13,
			EntityID:   21,
			EntityType: "post",
			ReasonText: strPtr("Link mencurigakan"),
			CreatedAt:  now.Add(-2 * time.Hour),
		},
		{
			UserID:     14,
			EntityID:   8,
			EntityType: "user",
			ReasonText: strPtr("Perilaku toxic di forum"),
			CreatedAt:  now.Add(-1 * time.Hour),
		},
	}

	for _, r := range reports {
		db.Create(&r)
	}
}

func timePtr(t time.Time) *time.Time {
	return &t
}