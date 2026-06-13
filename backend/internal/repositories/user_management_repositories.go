package repositories

import (
	"context"
	"fmt"

	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"

	"gorm.io/gorm"
)

type UserManagementRepository interface {
	FetchManageableUsers(filters dto.UserManagementFilterRequest) ([]dto.UserManagementResponse, int64, error)
	FindUserProfileByID(ctx context.Context, userID uint) (*models.UserProfile, error)
	UpdateUserStatus(ctx context.Context, userID uint, status string) error
	BannedPermanentUser(ctx context.Context, userID uint) error
	clearUserDependencies(tx *gorm.DB, userID uint) error
}

type userManagementRepository struct {
	db *gorm.DB
}

func NewUserManagementRepository(db *gorm.DB) UserManagementRepository {
	return &userManagementRepository{db: db}
}

func (r *userManagementRepository) FetchManageableUsers(filters dto.UserManagementFilterRequest) ([]dto.UserManagementResponse, int64, error) {
	var results []dto.UserManagementResponse
	var totalCount int64

	// PERBAIKAN: Tambahkan .Unscoped() setelah .Model(&models.User{})
	query := r.db.Model(&models.User{}).Unscoped().
		Select("users.user_id, users.username, users.email, users.role, users.status, users.is_active, users.email_verified, users.last_login, users.created_at, up.display_name, up.avatar_url").
		Joins("LEFT JOIN user_profiles up ON users.user_id = up.user_id")

	// 1. Kondisional Filter Pencarian (Username, Email, atau Display Name)
	if filters.Search != "" {
		searchPattern := fmt.Sprintf("%%%s%%", filters.Search)
		query = query.Where("(users.username ILIKE ? OR users.email ILIKE ? OR up.display_name ILIKE ?)", searchPattern, searchPattern, searchPattern)
	}

	// 2. Filter Status Akun
	if filters.Status != "" {
		query = query.Where("users.status = ?", filters.Status)
	}

	// 3. Filter Hak Akses / Role
	if filters.Role != "" {
		query = query.Where("users.role = ?", filters.Role)
	}

	// TAHAP A: Hitung total record sebelum dipotong LIMIT & OFFSET
	if err := query.Count(&totalCount).Error; err != nil {
		return nil, 0, err
	}

	// TAHAP B: Atur batasan record halaman
	limit := 10
	if filters.Limit > 0 {
		limit = filters.Limit
	}
	page := 1
	if filters.Page > 0 {
		page = filters.Page
	}
	offset := (page - 1) * limit

	// Eksekusi final query
	err := query.Order("users.created_at DESC").
		Limit(limit).
		Offset(offset).
		Scan(&results).Error

	if err != nil {
		return nil, 0, err
	}

	if results == nil {
		results = []dto.UserManagementResponse{}
	}

	return results, totalCount, nil
}

func (r *userManagementRepository) FindUserProfileByID(ctx context.Context, userID uint) (*models.UserProfile, error) {
	var profile models.UserProfile
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&profile).Error
	if err != nil {
		return nil, err
	}
	return &profile, nil
}

func (r *userManagementRepository) UpdateUserStatus(ctx context.Context, userID uint, status string) error {
	isActive := status == "active"
	
	return r.db.WithContext(ctx).Model(&models.User{}).
		Where("user_id = ?", userID).
		Updates(map[string]interface{}{
			"status":    status,
			"is_active": isActive,
		}).Error
}

func (r *userManagementRepository) BannedPermanentUser(ctx context.Context, userID uint) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. HARD DELETE semua dependensi yang berelasi dengan user_id ini
		if err := r.clearUserDependencies(tx, userID); err != nil {
			return err // otomatis rollback jika salah satu query gagal
		}

		// 2. SOFT DELETE User Utama & Update Status/IsActive menjadi Banned
		// GORM .Delete() otomatis mengisi deleted_at jika struct memiliki gorm.DeletedAt.
		// Namun karena kita ingin mengubah kolom 'status' dan 'is_active' secara bersamaan,
		// kita lakukan Update nilai kolom terlebih dahulu, baru kemudian Delete (soft delete).
		err := tx.Model(&models.User{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
			"status":    "banned",
			"is_active": false,
		}).Error
		if err != nil {
			return err
		}

		// Picu Soft Delete bawaan GORM untuk mengisi kolom deleted_at
		if err := tx.Where("user_id = ?", userID).Delete(&models.User{}).Error; err != nil {
			return err
		}

		return nil // commit transaksi jika seluruh proses sukses
	})
}

// Private helper function untuk mereduksi boilerplate query DELETE
func (r *userManagementRepository) clearUserDependencies(tx *gorm.DB, userID uint) error {
	// Daftar tabel 1-to-1 dan 1-to-many direct ownership
	tables := []string{
		"user_settings",
		"user_stats",
		"password_resets",
		"user_sessions",
		"user_social_links",
		"user_categories",
		"user_reading_stats",
	}

	for _, table := range tables {
		if err := tx.Exec(fmt.Sprintf("DELETE FROM %s WHERE user_id = ?", table), userID).Error; err != nil {
			return err
		}
	}

	// Bersihkan data interaksi sosial (Follow & Block)
	// User bisa bertindak sebagai penutur (follower) atau objek (followed)
	if err := tx.Exec("DELETE FROM user_follows WHERE user_followed_id = ? OR user_following_id = ?", userID, userID).Error; err != nil {
		return err
	}
	if err := tx.Exec("DELETE FROM user_blocks WHERE user_blocked_id = ? OR user_blocking_id = ?", userID, userID).Error; err != nil {
		return err
	}

	// Bersihkan relasi many-to-many badges & achievements
	if err := tx.Exec("DELETE FROM user_badges WHERE user_id = ?", userID).Error; err != nil {
		return err
	}
	if err := tx.Exec("DELETE FROM user_achievements WHERE user_id = ?", userID).Error; err != nil {
		return err
	}

	var postIDs []uint
	if err := tx.Model(&models.Post{}).Where("user_id = ?", userID).Pluck("post_id", &postIDs).Error; err != nil {
		return err
	}

	if len(postIDs) > 0 {
		// SOLUSI: Putuskan relasi di tabel messages terlebih dahulu dengan mengubahnya jadi NULL
		if err := tx.Exec("UPDATE messages SET post_id = NULL WHERE post_id IN ?", postIDs).Error; err != nil {
			return err
		}

		dependencyTables := []string{"post_categories", "post_comments", "post_likes", "post_saves", "post_shares", "post_stats"}
		for _, table := range dependencyTables {
			if err := tx.Exec(fmt.Sprintf("DELETE FROM %s WHERE post_id IN ?", table), postIDs).Error; err != nil {
				return err
			}
		}
		
		// Sekarang aman untuk menghapus posts tanpa melanggar Foreign Key
		if err := tx.Exec("DELETE FROM posts WHERE user_id = ?", userID).Error; err != nil {
			return err
		}
	}

	return nil
}