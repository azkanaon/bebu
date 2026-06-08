package repositories

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"backend-bebu/internal/domain"
	"github.com/redis/go-redis/v9"
)

type redisRepository struct {
	rdb *redis.Client
}

func NewRedisRepository(rdb *redis.Client) domain.RedisRepository {
	return &redisRepository{rdb: rdb}
}

func (r *redisRepository) IncrementLeaderboardScore(ctx context.Context, periodKey string, userID uint, amount int) error {
	pipe := r.rdb.Pipeline()

	member := fmt.Sprintf("%d", userID) // Menggunakan UserID sebagai identitas unik di Redis
	score := float64(amount)

	// 1. Update Leaderboard All-Time
	pipe.ZIncrBy(ctx, "leaderboard:all_time", score, member)

	// 2. Update Leaderboard Monthly berjalan (e.g. leaderboard:monthly:2026-06)
	monthlyKey := fmt.Sprintf("leaderboard:monthly:%s", periodKey)
	pipe.ZIncrBy(ctx, monthlyKey, score, member)

	// Eksekusi semua perintah sekaligus dalam 1 network round-trip
	_, err := pipe.Exec(ctx)
	return err
}

func (r *redisRepository) GetTopRankings(ctx context.Context, redisKey string, start, stop int64) ([]domain.RedisRankModel, error) {
	// ZRevRangeWithScores mengambil dari skor tertinggi ke terendah berdasarkan index jangkauan
	result, err := r.rdb.ZRevRangeWithScores(ctx, redisKey, start, stop).Result()
	if err != nil {
		return nil, err
	}

	var rankings []domain.RedisRankModel
	for _, z := range result {
		idStr, ok := z.Member.(string)
		if !ok {
			continue
		}
		id, _ := strconv.ParseUint(idStr, 10, 64)
		
		rankings = append(rankings, domain.RedisRankModel{
			UserID: uint(id),
			Score:  int(z.Score),
		})
	}

	return rankings, nil
}

func (r *redisRepository) GetUserRankAndScore(ctx context.Context, redisKey string, userID uint) (int64, int64, error) {
	member := fmt.Sprintf("%d", userID)
	
	pipe := r.rdb.Pipeline()
	rankCmd := pipe.ZRevRank(ctx, redisKey, member) // Mendapatkan index peringkat (0-based)
	scoreCmd := pipe.ZScore(ctx, redisKey, member)   // Mendapatkan total skor/exp

	_, err := pipe.Exec(ctx)
	if err != nil && !errors.Is(err, redis.Nil) {
		return 0, 0, err
	}

	// Jika user belum memiliki aktivitas/skor di Redis sama sekali
	if errors.Is(rankCmd.Err(), redis.Nil) || errors.Is(scoreCmd.Err(), redis.Nil) {
		return -1, 0, nil
	}

	// Peringkat asli adalah index redis + 1
	actualRank := rankCmd.Val() + 1
	score := int64(scoreCmd.Val())

	return actualRank, score, nil
}

func (r *redisRepository) GetAllRankings(ctx context.Context, redisKey string) ([]domain.RedisRankModel, error) {
	// Ambil seluruh isi ZSET dari urutan tertinggi (0 ke -1 berarti semua data)
	result, err := r.rdb.ZRevRangeWithScores(ctx, redisKey, 0, -1).Result()
	if err != nil {
		return nil, err
	}

	var rankings []domain.RedisRankModel
	for _, z := range result {
		idStr, _ := z.Member.(string)
		id, _ := strconv.ParseUint(idStr, 10, 64)

		rankings = append(rankings, domain.RedisRankModel{
			UserID: uint(id),
			Score:  int(z.Score),
		})
	}

	return rankings, nil
}