// user_repository.go

package repositories

import (
	"backend-bebu/internal/models"
	"gorm.io/gorm"
	"time"
)

type UserRepository interface {
	CreateUserAndProfile(user *models.User) (*models.User, error)
	FindByEmailOrUsername(emailOrUsername string) (*models.User, error)
	CreateSession(session *models.UserSession) error
	FindSessionByRefreshTokenHash(hash string) (*models.UserSession, error)
	FindUserByID(id uint) (*models.User, error)
	CreatePasswordReset(reset *models.PasswordReset) error
	FindPasswordResetByTokenHash(hash string) (*models.PasswordReset, error)
	ResetPasswordTransaction(userID uint, newPasswordHash string, resetID uint) error
}

type userRepository struct {
	db *gorm.DB
}

// NewUserRepository adalah constructor untuk userRepository
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

// CreateUserAndProfile membuat user dan profile dalam satu transaksi
func (r *userRepository) CreateUserAndProfile(user *models.User) (*models.User, error) {
	// Kita hanya butuh satu kali panggilan Create.
	// GORM akan secara otomatis menangani pembuatan record User dan UserProfile
	// yang berelasi karena Anda sudah mendefinisikan asosiasinya di struct model.
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(user).Error; err != nil {
			// Jika ada error (misal, unique constraint violation di tabel users),
			// transaksi akan di-rollback secara otomatis.
			return err
		}
		return nil
	})

	if err != nil {
		return nil, err
	}
	
	// 'user' object sekarang sudah terisi dengan ID yang digenerate oleh database
	return user, nil
}

// FindByEmailOrUsername akan kita gunakan di service layer untuk memeriksa duplikasi
func (r *userRepository) FindByEmailOrUsername(emailOrUsername string) (*models.User, error) {
	var user models.User
	err := r.db.Preload("Profile").Where("email = ?", emailOrUsername).Or("username = ?", emailOrUsername).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) CreateSession(session *models.UserSession) error {
	return r.db.Create(session).Error
}

func (r *userRepository) FindSessionByRefreshTokenHash(hash string) (*models.UserSession, error) {
	var session models.UserSession
	err := r.db.Where("refresh_token_hash = ?", hash).First(&session).Error
	return &session, err
}

func (r *userRepository) FindUserByID(id uint) (*models.User, error) {
    var user models.User
    err := r.db.First(&user, id).Error
    return &user, err
}

func (r *userRepository) CreatePasswordReset(reset *models.PasswordReset) error {
    return r.db.Create(reset).Error
}

func (r *userRepository) FindPasswordResetByTokenHash(hash string) (*models.PasswordReset, error) {
	var reset models.PasswordReset
	err := r.db.Where("token_hash = ?", hash).First(&reset).Error
	return &reset, err
}

func (r *userRepository) updateUserPassword(userID uint, newPasswordHash string) error {
	return r.db.Model(&models.User{}).Where("user_id = ?", userID).Update("password_hash", newPasswordHash).Error
}

func (r *userRepository) markPasswordResetAsUsed(resetID uint) error {
	return r.db.Model(&models.PasswordReset{}).Where("password_reset_id = ?", resetID).Update("used_at", time.Now()).Error
}

func (r *userRepository) ResetPasswordTransaction(userID uint, newPasswordHash string, resetID uint) error {
	// r.db adalah *gorm.DB dari struct userRepository
	return r.db.Transaction(func(tx *gorm.DB) error {
		// 1. Update password hash di tabel users
		if err := tx.Model(&models.User{}).Where("user_id = ?", userID).Update("password_hash", newPasswordHash).Error; err != nil {
			// Jika error, transaksi akan di-rollback secara otomatis
			return err
		}

		// 2. Update used_at di tabel password_resets
		if err := tx.Model(&models.PasswordReset{}).Where("password_reset_id = ?", resetID).Update("used_at", time.Now()).Error; err != nil {
			return err
		}

		// Jika tidak ada error, kembalikan nil untuk meng-commit transaksi
		return nil
	})
}