package repositories

import (
	"fmt"
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"

	"gorm.io/gorm"
)

type UserManagementRepository interface {
	FetchManageableUsers(filters dto.UserManagementFilterRequest) ([]dto.UserManagementResponse, int64, error)
	UpdateUserStatus(userID uint, status string) error
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

	// Inisialisasi query dasar dengan selective join ke profile
	query := r.db.Model(&models.User{}).
		Select("users.user_id, users.username, users.email, users.role, users.status, users.is_active, users.email_verified, users.last_login, users.created_at, up.display_name, up.avatar_url").
		Joins("LEFT JOIN user_profiles up ON users.user_id = up.user_id").
		Where("users.deleted_at IS NULL")

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

func (r *userManagementRepository) UpdateUserStatus(userID uint, status string) error {
	// Jika status diubah ke banned/suspended, is_active bisa diset false secara otomatis
	isActive := status == "active"
	
	return r.db.Model(&models.User{}).
		Where("user_id = ?", userID).
		Updates(map[string]interface{}{
			"status":    status,
			"is_active": isActive,
		}).Error
}