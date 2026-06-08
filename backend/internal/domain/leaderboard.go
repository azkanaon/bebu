package domain

import (
	"context"
	"backend-bebu/internal/models"
)

// DTO Internal untuk menampung data mentah dari Redis
type RedisRankModel struct {
	UserID uint
	Score  int
}

// Response Akhir yang dikirim ke Frontend
type LeaderboardRow struct {
	Rank      int    `json:"rank"`
	UserID    uint   `json:"user_id"`
	Username  string `json:"username"`
	AvatarURL string `json:"avatar_url,omitempty"` // Asumsi ada field ini di Profile kamu
	TotalExp  int    `json:"total_exp"`
}

type LeaderboardResponse struct {
	PeriodType string           `json:"period_type"`
	PeriodKey  string           `json:"period_key"`
	Data       []LeaderboardRow `json:"data"`
	MyRank     *LeaderboardRow  `json:"my_rank,omitempty"` // Nilai nil jika user belum masuk papan skor
}

// Repository Interfaces
type PostgresRepository interface {
	AddExpWithTransaction(ctx context.Context, sourceID *uint, userID uint, amount int, sourceType string) (interface{}, error)
	GetUsersProfileMap(ctx context.Context, userIDs []uint) (map[uint]models.User, error)
	UpsertRankings(ctx context.Context, rankings []models.UserRanking) error
}

type RedisRepository interface {
	IncrementLeaderboardScore(ctx context.Context, periodKey string, userID uint, amount int) error
	GetTopRankings(ctx context.Context, redisKey string, start, stop int64) ([]RedisRankModel, error)
	GetUserRankAndScore(ctx context.Context, redisKey string, userID uint) (int64, int64, error)
	GetAllRankings(ctx context.Context, redisKey string) ([]RedisRankModel, error)
}

// Service Interface
type ExpService interface {
	RewardExp(ctx context.Context, userID uint, sourceID *uint, sourceType string) error
}

type LeaderboardService interface {
	GetLeaderboard(ctx context.Context, periodType string, page int, limit int, currentUserID uint) (*LeaderboardResponse, error)
}

type WorkerService interface {
	SyncLeaderboardToPostgres(ctx context.Context, periodType string) error
}