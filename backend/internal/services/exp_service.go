package services

import (
	"context"
	"fmt"
	"backend-bebu/internal/domain"
	"time"
)

type ExpService interface {
	RewardExp(ctx context.Context, userID uint, sourceID *uint, sourceType string) error
}

type expService struct {
	pgRepo    domain.PostgresRepository
	redisRepo domain.RedisRepository
}

func NewExpService(pg domain.PostgresRepository, rds domain.RedisRepository) ExpService {
	return &expService{
		pgRepo:    pg,
		redisRepo: rds,
	}
}

// Helper untuk memetakan berapa EXP yang didapat per aktivitas
func (s *expService) getExpWeight(sourceType string) int {
	switch sourceType {
	case "POST_REVIEW":
		return 50 // Membuat ulasan buku
	case "POST_BEDAH":
		return 100 // Membuat bedah buku mendalam
	case "RECEIVE_LIKE":
		return 5 // Ulasan disukai orang lain
	default:
		return 10 // Aktivitas standar lainnya
	}
}

func (s *expService) RewardExp(ctx context.Context, userID uint, sourceID *uint, sourceType string) error {
	expAmount := s.getExpWeight(sourceType)

	// 1. Eksekusi ke PostgreSQL dulu (Kebenaran Data Utama)
	_, err := s.pgRepo.AddExpWithTransaction(ctx, sourceID, userID, expAmount, sourceType)
	if err != nil {
		return fmt.Errorf("failed to update exp in database: %w", err)
	}

	// 2. Dapatkan format bulan sekarang untuk redis key (Format: YYYY-MM)
	currentPeriod := time.Now().Format("2006-01")

	// 3. Update Cache Redis secara real-time
	err = s.redisRepo.IncrementLeaderboardScore(ctx, currentPeriod, userID, expAmount)
	if err != nil {
		// Log error di sini (gunakan logger profesional Anda seperti Zap/Logrus)
		// Jangan gagalkan proses utama jika hanya redis gagal, nanti bisa disinkronisasi lewat worker.
		fmt.Printf("[WARN] Failed to update redis leaderboard for user %d: %v\n", userID, err)
	}

	return nil
}