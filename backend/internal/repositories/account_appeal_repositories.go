package repositories

import (
	"context"
	"errors"
	"backend-bebu/internal/models"

	"gorm.io/gorm"
)

type AccountAppealRepository interface {
	GetPendingAppealByUserID(ctx context.Context, userID uint) (*models.AccountAppeal, error)
	GetLatestSuspensionActionByUserID(ctx context.Context, userID uint) (*models.AdminAction, error)
	CreateAppeal(ctx context.Context, appeal *models.AccountAppeal) error
}

type accountAppealRepository struct {
	db *gorm.DB
}

func NewAccountAppealRepository(db *gorm.DB) AccountAppealRepository {
	return &accountAppealRepository{db: db}
}

// Mengecek apakah user sudah memiliki tiket banding yang berstatus 'Pending'
func (r *accountAppealRepository) GetPendingAppealByUserID(ctx context.Context, userID uint) (*models.AccountAppeal, error) {
	var appeal models.AccountAppeal
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND status = ?", userID, "Pending").
		First(&appeal).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &appeal, nil
}

// Mengambil log admin_action terakhir milik user yang bertipe suspensi/ban
func (r *accountAppealRepository) GetLatestSuspensionActionByUserID(ctx context.Context, userID uint) (*models.AdminAction, error) {
	var action models.AdminAction
	err := r.db.WithContext(ctx).
		Where("entity_id = ? AND entity_type = ? AND action_type LIKE ?", int(userID), "user", "%suspend%").
		Order("created_at DESC").
		First(&action).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &action, nil
}

// Menyimpan data banding baru ke database
func (r *accountAppealRepository) CreateAppeal(ctx context.Context, appeal *models.AccountAppeal) error {
	return r.db.WithContext(ctx).Create(appeal).Error
}