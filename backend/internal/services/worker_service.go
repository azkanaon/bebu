package services

import (
	"context"
	"fmt"
	"backend-bebu/internal/domain"
	"backend-bebu/internal/models"
	"time"
)

type workerService struct {
	pgRepo    domain.PostgresRepository
	redisRepo domain.RedisRepository
}

func NewWorkerService(pg domain.PostgresRepository, rds domain.RedisRepository) domain.WorkerService {
	return &workerService{
		pgRepo:    pg,
		redisRepo: rds,
	}
}

func (s *workerService) SyncLeaderboardToPostgres(ctx context.Context, periodType string) error {
	var redisKey string
	var periodKey string

	// 1. Tentukan kalkulasi waktu berdasarkan tipe periode
	if periodType == "monthly" {
		periodKey = time.Now().Format("2006-01") // e.g. "2026-06"
		redisKey = fmt.Sprintf("leaderboard:monthly:%s", periodKey)
	} else {
		periodType = "all_time"
		periodKey = "all"
		redisKey = "leaderboard:all_time"
	}

	// 2. Ambil snapshot data ter-update dari Redis
	redisData, err := s.redisRepo.GetAllRankings(ctx, redisKey)
	if err != nil {
		return fmt.Errorf("failed to get data from redis: %w", err)
	}

	if len(redisData) == 0 {
		return nil // Tidak ada data yang perlu disinkronkan
	}

	// 3. Transformasi data Redis ke Array Model GORM UserRanking
	var rankingsToUpsert []models.UserRanking
	for index, item := range redisData {
		rankingsToUpsert = append(rankingsToUpsert, models.UserRanking{
			UserID:     item.UserID,
			PeriodType: periodType,
			PeriodKey:  periodKey,
			TotalExp:   item.Score,
			GlobalRank: index + 1, // Urutan peringkat dimulai dari angka 1
			UpdatedAt:  time.Now(),
		})
	}

	// 4. Lakukan Bulk Upsert ke PostgreSQL
	err = s.pgRepo.UpsertRankings(ctx, rankingsToUpsert)
	if err != nil {
		return fmt.Errorf("failed to upsert data to postgres: %w", err)
	}

	return nil
}