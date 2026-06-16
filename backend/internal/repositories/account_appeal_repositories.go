package repositories

import (
	"context"
	"errors"
	"backend-bebu/internal/models"

	"gorm.io/gorm"
)

type AccountAppealRepository interface {
	// Action Side
	GetPendingAppealByUserID(ctx context.Context, userID uint) (*models.AccountAppeal, error)
	GetLatestSuspensionActionByUserID(ctx context.Context, userID uint) (*models.AdminAction, error)
	CreateAppeal(ctx context.Context, appeal *models.AccountAppeal) error

	// Admin Side
	FindAllAppeals(ctx context.Context) ([]models.AccountAppeal, error)
	FindAppealByID(ctx context.Context, id uint) (*models.AccountAppeal, error)
	UpdateAppealStatus(ctx context.Context, appeal *models.AccountAppeal) error
	UpdateUserStatus(ctx context.Context, userID uint, status string) error
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

// FindAllAppeals mengambil semua data banding beserta relasi profil usernya untuk tabel dashboard admin
func (r *accountAppealRepository) FindAllAppeals(ctx context.Context) ([]models.AccountAppeal, error) {
	var appeals []models.AccountAppeal
	err := r.db.WithContext(ctx).
		Preload("User.Profile"). // Mengambil data user dan inner join / preload profile-nya
		Order("created_at DESC").
		Find(&appeals).Error
	return appeals, err
}

// FindAppealByID mengambil satu baris detail banding beserta riwayat suspensinya (AdminAction)
func (r *accountAppealRepository) FindAppealByID(ctx context.Context, id uint) (*models.AccountAppeal, error) {
	var appeal models.AccountAppeal
	err := r.db.WithContext(ctx).
		Preload("User.Profile").
		Preload("AdminAction").
		Where("account_appeal_id = ?", id).
		First(&appeal).Error

	if err != nil {
		return nil, err
	}
	return &appeal, nil
}

// UpdateAppealStatus memperbarui keputusan admin terhadap berkas banding yang masuk
func (r *accountAppealRepository) UpdateAppealStatus(ctx context.Context, appeal *models.AccountAppeal) error {
	return r.db.WithContext(ctx).Model(appeal).
		Select("Status", "AdminNotes", "ReviewedByAdminID", "ReviewedAt").
		Updates(appeal).Error
}

// UpdateUserStatus mengubah status utama user secara langsung (misal dari 'suspended' balik menjadi 'active')
func (r *accountAppealRepository) UpdateUserStatus(ctx context.Context, userID uint, status string) error {
	return r.db.WithContext(ctx).Model(&models.User{}).
		Where("user_id = ?", userID).
		Update("status", status).Error
}