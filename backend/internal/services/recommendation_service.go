package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/repositories"
)

type RecommendationService interface {
	GetFriendRecommendations(currentUserID uint) ([]dto.FriendRecommendationResponse, error)
}

type recommendationService struct {
	repo repositories.RecommendationRepository
}

func NewRecommendationService(repo repositories.RecommendationRepository) RecommendationService {
	return &recommendationService{repo: repo}
}

func (s *recommendationService) GetFriendRecommendations(currentUserID uint) ([]dto.FriendRecommendationResponse, error) {
	rows, err := s.repo.GetScoredFriendRecommendations(currentUserID, 4)
	if err != nil {
		return nil, err
	}

	var result []dto.FriendRecommendationResponse
	for _, row := range rows {
		u := row.User // Ambil data objek user utamanya
		
		avatar := "https://ui-avatars.com/api/?name=" + u.Username
		bio := ""
		name := u.Username
		followersCount := 0
		followingCount := 0

		if u.Profile != nil {
			if u.Profile.AvatarUrl != "" {
				avatar = u.Profile.AvatarUrl
			}
			if u.Profile.DisplayName != "" {
				name = u.Profile.DisplayName
			}
			bio = u.Profile.Bio
		}

		if u.Stats != nil {
			followersCount = u.Stats.TotalFollowers
			followingCount = u.Stats.TotalFollowing
		}

		result = append(result, dto.FriendRecommendationResponse{
			ID:             u.UserID,
			Name:           name,
			Username:       u.Username,
			Avatar:         avatar,
			Bio:            bio,
			TotalFollowers: followersCount,
			TotalFollowing: followingCount,
			
			// 🔥 Mapping nilai skor debug ke response JSON
			MatchScore:    row.MatchScore,
			MutualScore:   row.MutualScore,
			GenreScore:    row.GenreScore,
			ActivityScore: row.ActivityScore,
		})
	}

	return result, nil
}