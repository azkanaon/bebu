package repositories

import (
	"backend-bebu/internal/models"
	"gorm.io/gorm"
)

type FollowRepository struct {
	DB *gorm.DB
}

func NewFollowRepository(db *gorm.DB) *FollowRepository {
	return &FollowRepository{db}
}

func (r *FollowRepository) Follow(userID, targetID uint) error {
	follow := models.UserFollow{
		UserFollowingID: userID,
		UserFollowedID:  targetID,
	}

	return r.DB.Create(&follow).Error
}

func (r *FollowRepository) Unfollow(userID, targetID uint) error {
	return r.DB.
		Where("user_following_id = ? AND user_followed_id = ?", userID, targetID).
		Delete(&models.UserFollow{}).Error
}

func (r *FollowRepository) IsFollowing(userID, targetID uint) (bool, error) {
	var count int64
	err := r.DB.
		Model(&models.UserFollow{}).
		Where("user_following_id = ? AND user_followed_id = ?", userID, targetID).
		Count(&count).Error

	return count > 0, err
}