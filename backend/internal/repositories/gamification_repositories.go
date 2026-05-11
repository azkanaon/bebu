// user_repository.go

package repositories

import (
	"backend-bebu/internal/models"

	"gorm.io/gorm"
)

type GamificationRepository interface {
	GetUserBadges(userID uint, page, limit int) ([]models.UserBadge, int64, error)
    GetUserAchievements(userID uint, page, limit int) ([]models.UserAchievement, int64, error)
	// --- METHOD BARU UNTUK FAVORIT ---
	ClearFavoriteBadges(userID uint) error
	SetFavoriteBadge(userID uint, badgeID uint, order int16) error
	ClearFavoriteAchievements(userID uint) error
	SetFavoriteAchievement(userID uint, achievementID uint, order int16) error
	
	// Dukungan Transaksi
	WithTx(tx *gorm.DB) GamificationRepository
}

type gamificationRepository struct {
	db *gorm.DB
}

// NewUserRepository adalah constructor untuk userRepository
func NewGamificationRepository(db *gorm.DB) GamificationRepository {
	return &gamificationRepository{db: db}
}


func (r *gamificationRepository) GetUserBadges(userID uint, page, limit int) ([]models.UserBadge, int64, error) {
    var userBadges []models.UserBadge
    var total int64
    offset := (page - 1) * limit

    query := r.db.Model(&models.UserBadge{}).Where("user_id = ?", userID)
    
    err := query.Count(&total).Error
    if err != nil {
        return nil, 0, err
    }

    // Ambil data dengan Preload ke tabel master Badge
    // Kita urutkan: yang favorit di atas, sisanya berdasarkan tanggal didapat
    err = query.Preload("Badge").
        Offset(offset).Limit(limit).
        Order("display_order ASC NULLS LAST, earned_at DESC").
        Find(&userBadges).Error

    return userBadges, total, err
}

func (r *gamificationRepository) GetUserAchievements(userID uint, page, limit int) ([]models.UserAchievement, int64, error) {
    var userAchievements []models.UserAchievement
    var total int64
    offset := (page - 1) * limit

    query := r.db.Model(&models.UserAchievement{}).Where("user_id = ?", userID)
    
    err := query.Count(&total).Error
    if err != nil {
        return nil, 0, err
    }

    err = query.Preload("Achievement").
        Offset(offset).Limit(limit).
        Order("display_order ASC NULLS LAST, earned_at DESC").
        Find(&userAchievements).Error

    return userAchievements, total, err
}

func (r *gamificationRepository) WithTx(tx *gorm.DB) GamificationRepository {
	return &gamificationRepository{db: tx}
}

func (r *gamificationRepository) ClearFavoriteBadges(userID uint) error {
	// Set semua display_order menjadi NULL untuk user ini
	return r.db.Model(&models.UserBadge{}).
		Where("user_id = ?", userID).
		Update("display_order", nil).Error
}

func (r *gamificationRepository) SetFavoriteBadge(userID uint, badgeID uint, order int16) error {
	result := r.db.Model(&models.UserBadge{}).
		Where("user_id = ? AND badge_id = ?", userID, badgeID).
		Update("display_order", order)

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}

func (r *gamificationRepository) ClearFavoriteAchievements(userID uint) error {
	return r.db.Model(&models.UserAchievement{}).
		Where("user_id = ?", userID).
		Update("display_order", nil).Error
}

func (r *gamificationRepository) SetFavoriteAchievement(userID uint, achievementID uint, order int16) error {
	result := r.db.Model(&models.UserAchievement{}).
		Where("user_id = ? AND achievement_id = ?", userID, achievementID).
		Update("display_order", order)

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}