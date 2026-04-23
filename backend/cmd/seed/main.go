package main

import (
    "log"
	"gorm.io/gorm"

    "backend-bebu/config"
    "backend-bebu/internal/seeders"
)

func main() {
    log.Println("🚀 Starting seeder...")

    // init DB
    config.LoadAndConnectDB()

    db := config.GetDB()

    // optional: pakai transaction (RECOMMENDED)
    err := db.Transaction(func(tx *gorm.DB) error {
        seeders.RunAll(tx)
        return nil
    })

    if err != nil {
        log.Fatal("❌ Seeding failed:", err)
    }

    log.Println("✅ Seeding completed!")
}