package worker

import (
	"context"
	"log"
	"backend-bebu/internal/domain"
	"time"

	"github.com/robfig/cron/v3"
)

type LeaderboardCron struct {
	workerService domain.WorkerService
}

// Parameter diganti menjadi domain.WorkerService
func NewLeaderboardCron(ws domain.WorkerService) *LeaderboardCron {
	return &LeaderboardCron{workerService: ws}
}

func (lc *LeaderboardCron) Start() {
	// cron.WithLocation sekarang menggunakan time.Local bawaan golang
	c := cron.New(cron.WithLocation(time.Local))

	// Jalankan sinkronisasi otomatis SETIAP HARI pada jam 00:00 Malam
	_, err := c.AddFunc("0 0 * * *", func() {
		log.Println("[Cron] Starting Leaderboard Synchronizer Worker...")
		ctx := context.Background()

		// 1. Sinkronisasi All-Time
		if err := lc.workerService.SyncLeaderboardToPostgres(ctx, "all_time"); err != nil {
			log.Printf("[Cron Error] Failed to sync all-time leaderboard: %v\n", err)
		}

		// 2. Sinkronisasi Monthly berjalan
		if err := lc.workerService.SyncLeaderboardToPostgres(ctx, "monthly"); err != nil {
			log.Printf("[Cron Error] Failed to sync monthly leaderboard: %v\n", err)
		}

		log.Println("[Cron] Leaderboard Sync Worker finished successfully.")
	})

	if err != nil {
		log.Fatalf("Failed to initialize cron worker: %v", err)
	}

	// Mulai jalankan cron secara asynchronous (non-blocking)
	c.Start()
	log.Println("[Cron] Leaderboard background worker manager is running...")
}