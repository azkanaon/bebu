// user_repository.go

package repositories

import (
	"backend-bebu/internal/models"
	"errors"
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
	IsFollowing(viewerID, targetID uint) (bool, error)
	IsBlocked(viewerID, targetID uint) (bool, error)
	FollowUser(db *gorm.DB, sourceUserID, targetUserID uint, status string) (string, bool, error)
	UnfollowUser(db *gorm.DB, followerID, followingID uint) error
	UpdateProfile(userID uint, updates map[string]interface{}) error
	UpdateSettings(userID uint, updates map[string]interface{}) error
	UpdateSocialLinks(userID uint, links []models.UserSocialLink) error
	WithTx(tx *gorm.DB) UserRepository
	GetFollowStatus(sourceUserID, targetUserID uint) (string, error)
	GetPendingFollowRequests(userID uint) ([]models.UserFollow, error)
	UpdateFollowStatus(db *gorm.DB, sourceUserID, targetUserID uint, newStatus string) error
	DeleteFollowRequest(sourceUserID, targetUserID uint) error
	BlockUser(db *gorm.DB, blockingUserID, blockedUserID uint) error
	UnblockUser(blockingUserID, blockedUserID uint) error
	UpdateUserStat(db *gorm.DB, userID uint, columnName string, amount int) error
    GetUserStats(userID uint) (*models.UserStat, error)
	SearchUsers(query string, limit int) ([]models.User, error)

	GetFollowers(userID uint, page, limit int) ([]models.User, int64, error)
	GetFollowing(userID uint, page, limit int) ([]models.User, int64, error)
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

func (r *userRepository) RevokeSessionByRefreshTokenHash(hash string) error {
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

func (r *userRepository) FindByUsername(username string) (*models.User, error) {
	var user models.User
	err := r.db.
		Preload("Profile").
		Preload("Settings").
		Preload("SocialLinks.Platform"). // Preload social links dan platform-nya
		Preload("FavoriteUserBadges", "display_order IS NOT NULL", func(db *gorm.DB) *gorm.DB {
            return db.Order("user_badges.display_order ASC").Limit(4).Preload("Badge")
        }).
        // Preload Favorite Achievements melalui UserAchievement
        Preload("FavoriteUserAchievements", "display_order IS NOT NULL", func(db *gorm.DB) *gorm.DB {
            return db.Order("user_achievements.display_order ASC").Limit(4).Preload("Achievement")
        }).
		Joins("JOIN user_profiles ON users.user_id = user_profiles.user_id"). // pastikan profile ada
		Where("users.username = ?", username).
		First(&user).Error

	if err != nil {
		return nil, err // GORM akan return gorm.ErrRecordNotFound jika tidak ada
	}
	return &user, nil
}

// IsFollowing memeriksa apakah viewerID mengikuti targetID
func (r *userRepository) IsFollowing(viewerID, targetID uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.UserFollow{}).
		Where("user_followed_id = ? AND user_following_id = ?", viewerID, targetID).
		Count(&count).Error
	return count > 0, err
}

func (r *userRepository) FindUserByPublicID(publicID uuid.UUID) (*models.User, error) {
    var user models.User
    err := r.db.Where("public_id = ?", publicID).First(&user).Error
    return &user, err
}

// FollowUser membuat entri baru di tabel user_follows.
func (r *userRepository) FollowUser(db *gorm.DB, sourceUserID, targetUserID uint, status string) (string, bool, error) {
	// 1. Cek apakah sudah ada di database
	var existing models.UserFollow
	err := db.Where("user_following_id = ? AND user_followed_id = ?", sourceUserID, targetUserID).First(&existing).Error
	
	if err == nil {
		// Jika tidak error, artinya data sudah ada (sudah follow sebelumnya)
		return "", false, errors.New("you already follow this user")
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		// Jika error karena database down/masalah lain
		return "", false, err
	}

	// 2. Jika tidak ada, lakukan Insert
	follow := models.UserFollow{
		UserFollowingID: sourceUserID,
		UserFollowedID:  targetUserID,
		FollowingStatus: status,
	}

	if err := db.Create(&follow).Error; err != nil {
		return "", false, err
	}

	return status, true, nil // true = data baru
}

// UnfollowUser menghapus entri dari tabel user_follows.
func (r *userRepository) UnfollowUser(db *gorm.DB, sourceUserID, targetUserID uint) error {
	result := db.Where("user_following_id = ? AND user_followed_id = ?", sourceUserID, targetUserID).Delete(&models.UserFollow{})
	
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
	
	result := r.db.Model(&models.UserSetting{}).Clauses(clause.OnConflict{
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

func (r *userRepository) GetFollowStatus(sourceUserID, targetUserID uint) (string, error) {
	var follow models.UserFollow
	
	// Cari relasi follow antara dua user ini
	err := r.db.Where("user_following_id = ? AND user_followed_id = ?", sourceUserID, targetUserID).First(&follow).Error
	
	if err != nil {
		// Jika tidak ada baris sama sekali, GORM akan mengembalikan ErrRecordNotFound.
		// Ini bukan error, artinya statusnya adalah "not_following".
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "not_following", nil
		}
		// Untuk error database lainnya, kembalikan error
		return "", err
	}
	
	// Jika baris ditemukan, kembalikan statusnya
	return follow.FollowingStatus, nil
}

func (r *userRepository) GetPendingFollowRequests(userID uint) ([]models.UserFollow, error) {
	var requests []models.UserFollow
	
	// Kita cari semua baris di mana userID adalah 'user_followed_id' (target)
	// dan statusnya 'pending'.
	// Kita juga Preload data 'UserFollowing' agar bisa menampilkan info user yang me-request.
	err := r.db.
		Preload("UserFollowing.Profile"). // Preload data user yang me-request + profilnya
		Where("user_followed_id = ? AND following_status = ?", userID, "pending").
		Find(&requests).Error
		
	return requests, err
}

// UpdateFollowStatus mengubah status sebuah relasi follow.
func (r *userRepository) UpdateFollowStatus(db *gorm.DB, sourceUserID, targetUserID uint, newStatus string) error {
	result := r.db.Model(&models.UserFollow{}).
		Where("user_following_id = ? AND user_followed_id = ?", sourceUserID, targetUserID).
		Update("following_status", newStatus)
		
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound // Tidak ada relasi untuk diupdate
	}
	return nil
}

// DeleteFollowRequest menghapus sebuah relasi follow. Ini sama persis dengan UnfollowUser.
// Kita bisa membuat alias atau panggil UnfollowUser dari service, tapi membuat ini eksplisit juga bagus.
func (r *userRepository) DeleteFollowRequest(sourceUserID, targetUserID uint) error {
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

// BlockUser membuat entri baru di tabel user_blocks.
func (r *userRepository) BlockUser(db *gorm.DB, blockingUserID, blockedUserID uint) error {
	block := models.UserBlock{
		UserBlockingID: blockingUserID,
		UserBlockedID:  blockedUserID,
	}

	// Gunakan db yang dipassing (yang sudah terikat transaksi)
	result := db.Clauses(clause.OnConflict{
		DoNothing: true,
	}).Create(&block)

	return result.Error
}

// UnblockUser menghapus entri dari tabel user_blocks.
func (r *userRepository) UnblockUser(blockingUserID, blockedUserID uint) error {
	block := models.UserBlock{
		UserBlockingID: blockingUserID,
		UserBlockedID:  blockedUserID,
	}
	
	result := r.db.Delete(&block)

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound // Tidak ada relasi blokir untuk dihapus
	}
	return nil
}

func (r *userRepository) IsBlocked(blockingUserID, blockedUserID uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.UserBlock{}).
		Where("user_blocking_id = ? AND user_blocked_id = ?", blockingUserID, blockedUserID).
		Count(&count).Error
	return count > 0, err
}

// amount bisa positif (untuk increment) atau negatif (untuk decrement).
func (r *userRepository) UpdateUserStat(db *gorm.DB, userID uint, columnName string, amount int) error {
	return db.Model(&models.UserStat{}).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			columnName: gorm.Expr("user_stats." + columnName + " + ?", amount),
		}),
	}).Create(map[string]interface{}{
		"user_id":    userID,
		columnName:   amount,
	}).Error
}

// GetUserStats mengambil data statistik untuk seorang user.
func (r *userRepository) GetUserStats(userID uint) (*models.UserStat, error) {
    var stats models.UserStat
    // Kita gunakan FirstOrInit untuk mengembalikan struct kosong (dengan nilai default 0)
    // jika user belum punya entri di user_stats, daripada mengembalikan error not found.
    // Ini membuat logika di service lebih sederhana.
    result := r.db.Where("user_id = ?", userID).FirstOrInit(&stats)
    return &stats, result.Error
}

func (r *userRepository) SearchUsers(query string, limit int) ([]models.User, error) {
    var users []models.User
    
    // Cari berdasarkan username atau display name
    err := r.db.Preload("Profile").
        Joins("JOIN user_profiles ON user_profiles.user_id = users.user_id").
        Where("users.username ILIKE ? OR user_profiles.display_name ILIKE ?", 
            "%"+query+"%", "%"+query+"%").
        Limit(limit).
        Find(&users).Error
        
    return users, err
}

func (r *userRepository) GetFollowers(userID uint, page, limit int) ([]models.User, int64, error) {
	var users []models.User
	var total int64
	offset := (page - 1) * limit

	// Subquery untuk mendapatkan ID para follower
	followerIDsSubQuery := r.db.Model(&models.UserFollow{}).
		Select("user_following_id").
		Where("user_followed_id = ? AND following_status = ?", userID, "accepted")

	// Hitung total follower
	err := followerIDsSubQuery.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Ambil data user para follower dengan paginasi
	err = r.db.Preload("Profile").
		Where("user_id IN (?)", followerIDsSubQuery.Offset(offset).Limit(limit)).
		Find(&users).Error

	return users, total, err
}

// GetFollowing mengambil daftar user yang diikuti oleh userID.
func (r *userRepository) GetFollowing(userID uint, page, limit int) ([]models.User, int64, error) {
	var users []models.User
	var total int64
	offset := (page - 1) * limit

	// Subquery untuk mendapatkan ID user yang di-follow
	followingIDsSubQuery := r.db.Model(&models.UserFollow{}).
		Select("user_followed_id").
		Where("user_following_id = ? AND following_status = ?", userID, "accepted")

	// Hitung total
	err := followingIDsSubQuery.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Ambil data user yang di-follow dengan paginasi
	err = r.db.Preload("Profile").
		Where("user_id IN (?)", followingIDsSubQuery.Offset(offset).Limit(limit)).
		Find(&users).Error

	return users, total, err
}