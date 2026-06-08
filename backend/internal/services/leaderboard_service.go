package services

import (
	"backend-bebu/internal/domain"
	"context"
	"fmt"
	"time"
)

type leaderboardService struct {
	pgRepo    domain.PostgresRepository
	redisRepo domain.RedisRepository
}

func NewLeaderboardService(pg domain.PostgresRepository, rds domain.RedisRepository) domain.LeaderboardService {
	return &leaderboardService{
		pgRepo:    pg,
		redisRepo: rds,
	}
}

func (s *leaderboardService) GetLeaderboard(ctx context.Context, periodType string, page int, limit int, currentUserID uint) (*domain.LeaderboardResponse, error) {
	// 1. Tentukan Redis Key & Period Key
	var redisKey string
	var periodKey string

	if periodType == "monthly" {
		periodKey = time.Now().Format("2006-01") // Format "2026-06"
		redisKey = fmt.Sprintf("leaderboard:monthly:%s", periodKey)
	} else {
		periodType = "all_time"
		periodKey = "all"
		redisKey = "leaderboard:all_time"
	}

	// 2. Hitung pagination index untuk Redis (0-based indexing)
	start := int64((page - 1) * limit)
	stop := start + int64(limit) - 1

	// 3. Ambil data mentah ranking dari Redis
	redisRanks, err := s.redisRepo.GetTopRankings(ctx, redisKey, start, stop)
	if err != nil {
		return nil, err
	}

	// Collect semua UserID untuk query pengayaan data profil ke PostgreSQL
	var userIDs []uint
	for _, r := range redisRanks {
		userIDs = append(userIDs, r.UserID)
	}

	// 4. Ambil profil user dari PostgreSQL menggunakan Map O(1)
	userMap, err := s.pgRepo.GetUsersProfileMap(ctx, userIDs)
	if err != nil {
		return nil, err
	}

	// 5. Susun Response Data urutan papan skor
	var rows []domain.LeaderboardRow
	for i, r := range redisRanks {
		row := domain.LeaderboardRow{
			Rank:     int(start) + i + 1,
			UserID:   r.UserID,
			TotalExp: r.Score,
			Username: fmt.Sprintf("User_%d", r.UserID), // Fallback jika user terhapus di DB tapi cache ada
		}

		if u, exists := userMap[r.UserID]; exists {
			row.Username = u.Username
			if u.Profile != nil && u.Profile.AvatarUrl != "" {
				row.AvatarURL = u.Profile.AvatarUrl
			}
		}
		rows = append(rows, row)
	}

	response := &domain.LeaderboardResponse{
		PeriodType: periodType,
		PeriodKey:  periodKey,
		Data:       rows,
	}

	// 6. FITUR PRO: Ambil data peringkat milik user yang sedang request (Sticky My Rank)
	if currentUserID > 0 {
		myRank, myScore, err := s.redisRepo.GetUserRankAndScore(ctx, redisKey, currentUserID)
		if err == nil && myRank != -1 {
			// Ambil detail profil user itu sendiri
			myProfileMap, _ := s.pgRepo.GetUsersProfileMap(ctx, []uint{currentUserID})
			
			myRow := domain.LeaderboardRow{
				Rank:     int(myRank),
				UserID:   currentUserID,
				TotalExp: int(myScore),
				Username: "Me",
			}
			if u, exists := myProfileMap[currentUserID]; exists {
				myRow.Username = u.Username
				if u.Profile != nil && u.Profile.AvatarUrl != "" {
					myRow.AvatarURL = u.Profile.AvatarUrl
				}
			}
			response.MyRank = &myRow
		}
	}

	return response, nil
}