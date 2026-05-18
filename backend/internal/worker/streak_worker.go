package worker

import (
	"backend-bebu/internal/repositories"
	"log"

	"github.com/robfig/cron/v3"
)

func InitStreakWorker(repo repositories.BookshelfRepository) {
	// 1. Buat scheduler baru
	c := cron.New()

	// 2. Tambahkan Job: Jalan setiap hari pada jam 00:01 pagi
	// Format Cron: "Menit Jam HariBulan Bulan HariMinggu"
	_, err := c.AddFunc("1 0 * * *", func() {
		log.Println("[Worker] Starting streak reset job...")
		
		err := repo.ResetExpiredStreaks()
		if err != nil {
			log.Printf("[Worker] ERROR resetting streaks: %v", err)
		} else {
			log.Println("[Worker] Streak reset job completed successfully.")
		}
	})

	if err != nil {
		log.Fatalf("Failed to initialize cron worker: %v", err)
	}

	// 3. Jalankan scheduler secara background (non-blocking)
	c.Start()
	log.Println("[Worker] Streak Worker is running...")
}