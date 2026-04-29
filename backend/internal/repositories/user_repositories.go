// user_repository.go

package repositories

import (
	"backend-bebu/internal/models"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type UserRepository interface {
	// authentication
	CreateUserAndProfile(user *models.User) (*models.User, error)
	FindByEmailOrUsername(emailOrUsername string) (*models.User, error)
	CreateSession(session *models.UserSession) error
	FindSessionByRefreshTokenHash(hash string) (*models.UserSession, error)
	FindUserByID(id uint) (*models.User, error)
	CreatePasswordReset(reset *models.PasswordReset) error
	FindPasswordResetByTokenHash(hash string) (*models.PasswordReset, error)
	ResetPasswordTransaction(userID uint, newPasswordHash string, resetID uint) error
	RevokeSessionByRefreshTokenHash(hash string) error

	// user profile
	FindUserByPublicID(publicID uuid.UUID) (*models.User, error)
	FindByUsername(username string) (*models.User, error)
	GetFollowerCount(userID uint) (int64, error)
	GetFollowingCount(userID uint) (int64, error)
	IsFollowing(viewerID, targetID uint) (bool, error)
	IsBlocked(viewerID, targetID uint) (bool, error)
	FollowUser(followerID, followingID uint) error
	UnfollowUser(followerID, followingID uint) error
	UpdateProfile(userID uint, updates map[string]interface{}) error
	UpdateSettings(userID uint, updates map[string]interface{}) error
	UpdateSocialLinks(userID uint, links []models.UserSocialLink) error
	WithTx(tx *gorm.DB) UserRepository
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
	err := r.db.Preload("Profile").First(&user, id).Error
    
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

// RevokeSessionByRefreshTokenHash menandai sebuah sesi sebagai tidak valid/dicabut.
func (r *userRepository) RevokeSessionByRefreshTokenHash(hash string) error {
	// Kita update kolom 'revoked_at' dengan waktu saat ini.
	// Kita hanya update sesi yang hash-nya cocok DAN belum pernah dicabut.
	result := r.db.Model(&models.UserSession{}).
		Where("refresh_token_hash = ? AND revoked_at IS NULL", hash).
		Update("revoked_at", time.Now())

	if result.Error != nil {
		return result.Error
	}
	
	// Jika RowsAffected adalah 0, berarti tidak ada sesi yang cocok ditemukan untuk dicabut.
	if result.RowsAffected == 0 {
		return nil 
	}

	return nil
}

// FindByUsername menemukan user beserta relasi yang dibutuhkan untuk halaman profil
func (r *userRepository) FindByUsername(username string) (*models.User, error) {
	var user models.User
	err := r.db.
		Preload("Profile").
		Preload("Settings").
		Preload("SocialLinks.Platform"). // Preload social links dan platform-nya
		Preload("Badges").               // Preload badges yg dimiliki user
		Preload("UserAchievements.Achievement").
		Joins("JOIN user_profiles ON users.user_id = user_profiles.user_id"). // pastikan profile ada
		Where("users.username = ?", username).
		First(&user).Error

	if err != nil {
		return nil, err // GORM akan return gorm.ErrRecordNotFound jika tidak ada
	}
	return &user, nil
}

// GetFollowerCount menghitung jumlah follower seorang user
func (r *userRepository) GetFollowerCount(userID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.UserFollow{}).Where("user_followed_id = ?", userID).Count(&count).Error
	return count, err
}

// GetFollowingCount menghitung jumlah user yang di-follow oleh seorang user
func (r *userRepository) GetFollowingCount(userID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.UserFollow{}).Where("user_following_id = ?", userID).Count(&count).Error
	return count, err
}

// IsFollowing memeriksa apakah viewerID mengikuti targetID
func (r *userRepository) IsFollowing(viewerID, targetID uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.UserFollow{}).
		Where("user_followed_id = ? AND user_following_id = ?", viewerID, targetID).
		Count(&count).Error
	return count > 0, err
}

// IsBlocked memeriksa apakah viewerID memblokir targetID
func (r *userRepository) IsBlocked(viewerID, targetID uint) (bool, error) {
	var count int64
	// Asumsi nama kolom di user_blocks adalah user_blocking_id (yang memblokir) dan user_blocked_id (yang diblokir)
	err := r.db.Model(&models.UserBlock{}).
		Where("user_blocking_id = ? AND user_blocked_id = ?", viewerID, targetID).
		Count(&count).Error
	return count > 0, err
}

func (r *userRepository) FindUserByPublicID(publicID uuid.UUID) (*models.User, error) {
    var user models.User
    err := r.db.Where("public_id = ?", publicID).First(&user).Error
    return &user, err
}

// FollowUser membuat entri baru di tabel user_follows.
func (r *userRepository) FollowUser(sourceUserID, targetUserID uint) error {
	follow := map[string]interface{}{
		"user_following_id": sourceUserID, // Yang me-follow
		"user_followed_id":  targetUserID, // Yang di-follow
	}
	result := r.db.Model(&models.UserFollow{}).Clauses(clause.OnConflict{DoNothing: true}).Create(follow)
	return result.Error
}

// UnfollowUser menghapus entri dari tabel user_follows.
func (r *userRepository) UnfollowUser(sourceUserID, targetUserID uint) error {
	follow := models.UserFollow{
		UserFollowingID: sourceUserID,
		UserFollowedID:  targetUserID,
	}
	result := r.db.Delete(&follow)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *userRepository) WithTx(tx *gorm.DB) UserRepository {
	// Buat klon dari repository saat ini, tapi ganti db-nya dengan tx
	return &userRepository{db: tx}
}

func (r *userRepository) UpdateProfile(userID uint, updates map[string]interface{}) error {
	// Kita update berdasarkan user_id, bukan profile_id, agar lebih konsisten.
	// .Where("user_id = ?", userID) akan menargetkan baris yang benar.
	// .Model(&models.UserProfile{}) akan menargetkan tabel yang benar.
	result := r.db.Model(&models.UserProfile{}).Where("user_id = ?", userID).Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	// Opsional: Cek jika tidak ada profil yang ter-update (misal user_id tidak ada)
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound // Atau error custom
	}
	return nil
}

// UpdateSettings memperbarui kolom-kolom spesifik di tabel user_settings.
func (r *userRepository) UpdateSettings(userID uint, updates map[string]interface{}) error {
	// Buat data lengkap untuk operasi Create/Insert.
	// Kita mulai dengan data update, lalu tambahkan user_id.
	fullData := make(map[string]interface{})
	for key, value := range updates {
		fullData[key] = value
	}
	fullData["user_id"] = userID

	// Buat daftar nama kolom yang akan diupdate jika terjadi konflik.
	// Kita ambil keys dari map 'updates' secara manual.
	var updateColumns []string
	for key := range updates {
		updateColumns = append(updateColumns, key)
	}

	// Jika tidak ada kolom yang perlu diupdate, tidak ada yang perlu dilakukan.
	if len(updateColumns) == 0 {
		return nil
	}
	
	result := r.db.Model(&models.UserSettings{}).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}}, // Kunci konflik
		DoUpdates: clause.AssignmentColumns(updateColumns), // Kolom yang diupdate
	}).Create(fullData)

	return result.Error
}

func (r *userRepository) UpdateSocialLinks(userID uint, links []models.UserSocialLink) error {
	// Operasi ini harus di dalam transaksi, yang sudah kita pastikan di service.
	
	// 1. Hapus semua social link yang ada untuk user ini.
	if err := r.db.Where("user_id = ?", userID).Delete(&models.UserSocialLink{}).Error; err != nil {
		return err
	}

	// 2. Jika daftar link yang baru tidak kosong, masukkan semuanya.
	if len(links) > 0 {
		// Pastikan setiap link memiliki UserID yang benar, meskipun service sudah mengaturnya.
		for i := range links {
			links[i].UserID = userID
		}
		
		if err := r.db.Create(&links).Error; err != nil {
			return err
		}
	}
	
	return nil
}