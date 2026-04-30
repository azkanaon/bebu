package services

import (
	"backend-bebu/internal/repositories"
	"errors"
)

type FollowService struct {
	Repo *repositories.FollowRepository
}

func NewFollowService(r *repositories.FollowRepository) *FollowService {
	return &FollowService{r}
}

func (s *FollowService) ToggleFollow(userID, targetID uint) (bool, error) {
	if userID == targetID {
		return false, errors.New("cannot follow yourself")
	}

	isFollowing, err := s.Repo.IsFollowing(userID, targetID)
	if err != nil {
		return false, err
	}

	if isFollowing {
		err = s.Repo.Unfollow(userID, targetID)
		return false, err
	}

	err = s.Repo.Follow(userID, targetID)
	return true, err
}