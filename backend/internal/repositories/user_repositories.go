package repositories

import (
	"backend-bebu/internal/models"
	"errors"
	"fmt"
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
	UpdatePassword(userID uint, newHash string) error
	UpdateLastLogin(userID uint) error

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
	GetPendingFollowRequests(userID uint, page, limit int) ([]models.UserFollow, int64, error)
	UpdateFollowStatus(db *gorm.DB, sourceUserID, targetUserID uint, newStatus string) error
	DeleteFollowRequest(sourceUserID, targetUserID uint) error
	BlockUser(db *gorm.DB, blockingUserID, blockedUserID uint) error
	UnblockUser(blockingUserID, blockedUserID uint) error
	UpdateUserStat(db *gorm.DB, userID uint, columnName string, amount int) error
    GetUserStats(userID uint) (*models.UserStat, error)
	SearchUsers(query string, excludeID uint, limit int) ([]models.User, error)

	GetFollowers(viewerID *uint, targetUserID uint, page, limit int) ([]models.User, int64, error)
    GetFollowing(viewerID *uint, targetUserID uint, page, limit int) ([]models.User, int64, error)
	AcceptAllPendingFollows(userID uint) (int64, error)
	GetPendingFollowerIDs(userID uint) ([]uint, error)
    BulkUpdateUserStat(db *gorm.DB, userIDs []uint, columnName string, amount int) error
	SyncUserStats(db *gorm.DB, userID uint, field string, amount int) error
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
	// GORM secara default akan menyimpan asosiasi (Profile, Settings, Stats) 
	// yang ada di dalam struct user selama field tersebut bukan nil/kosong.
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(user).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return nil, err
	}
	
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

func (r *userRepository) FindUserByID(userID uint) (*models.User, error) {
	var user models.User
	// PASTIKAN .Preload("Setting") (atau Settings) ada di sini!
	err := r.db.Preload("Profile").Preload("Settings").First(&user, userID).Error
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
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "not_following", nil
		}
		// Untuk error database lainnya, kembalikan error
		return "", err
	}
	return follow.FollowingStatus, nil
}

func (r *userRepository) GetPendingFollowRequests(userID uint, page, limit int) ([]models.UserFollow, int64, error) {
	var requests []models.UserFollow
	var total int64
	offset := (page - 1) * limit

	// Buat query dasar
	query := r.db.Model(&models.UserFollow{}).
		Where("user_followed_id = ? AND following_status = ?", userID, "pending")

	// 1. Hitung total baris untuk metadata
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 2. Ambil data dengan paginasi dan preload
	err := query.
		Preload("UserFollowing.Profile").
		Order("created_at DESC"). // Permintaan terbaru muncul paling atas
		Limit(limit).
		Offset(offset).
		Find(&requests).Error
		
	return requests, total, err
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

func (r *userRepository) SearchUsers(query string, excludeID uint, limit int) ([]models.User, error) {
    var users []models.User
    
    err := r.db.Preload("Profile").
        Joins("JOIN user_profiles ON user_profiles.user_id = users.user_id").
        Where("(users.username ILIKE ? OR user_profiles.display_name ILIKE ?) AND users.user_id <> ?", 
            "%"+query+"%", "%"+query+"%", excludeID).
        Limit(limit).
        Find(&users).Error
        
    return users, err
}

func (r *userRepository) GetFollowers(viewerID *uint, targetUserID uint, page, limit int) ([]models.User, int64, error) {
	var users []models.User
	var total int64
	offset := (page - 1) * limit

	// Hitung Total followers target (yang sudah accepted)
	r.db.Model(&models.UserFollow{}).
		Where("user_followed_id = ? AND following_status = 'accepted'", targetUserID).
		Count(&total)

	selectQuery := r.db.Model(&models.User{}).Select("users.*")

	// JOIN Utama: Mendapatkan list followers si targetUser
	selectQuery = selectQuery.Joins("JOIN user_follows AS target_follows ON target_follows.user_following_id = users.user_id").
		Where("target_follows.user_followed_id = ? AND target_follows.following_status = 'accepted'", targetUserID)

	if viewerID != nil {
		// Logika Skor 4 Tingkat
		selectQuery = selectQuery.Select(`
			users.*, 
			CASE 
				WHEN users.user_id = ? THEN 3
				WHEN viewer_follows.following_status = 'accepted' THEN 2
				WHEN viewer_follows.following_status = 'pending' THEN 1
				ELSE 0 
			END AS priority_score`, *viewerID).
			// PENTING: Kita hapus status='accepted' dari JOIN condition agar 'pending' juga ikut terbaca
			Joins("LEFT JOIN user_follows AS viewer_follows ON viewer_follows.user_followed_id = users.user_id AND viewer_follows.user_following_id = ?", *viewerID).
			Order("priority_score DESC")
	}

	err := selectQuery.
		Preload("Profile").
		Order("users.username ASC").
		Limit(limit).
		Offset(offset).
		Find(&users).Error

	return users, total, err
}

func (r *userRepository) GetFollowing(viewerID *uint, targetUserID uint, page, limit int) ([]models.User, int64, error) {
	var users []models.User
	var total int64
	offset := (page - 1) * limit

	// Hitung Total following target (yang sudah accepted)
	r.db.Model(&models.UserFollow{}).
		Where("user_following_id = ? AND following_status = 'accepted'", targetUserID).
		Count(&total)

	selectQuery := r.db.Model(&models.User{}).Select("users.*")

	// JOIN Utama: Mendapatkan list siapa saja yang di-follow si targetUser
	selectQuery = selectQuery.Joins("JOIN user_follows AS target_follows ON target_follows.user_followed_id = users.user_id").
		Where("target_follows.user_following_id = ? AND target_follows.following_status = 'accepted'", targetUserID)

	if viewerID != nil {
		// Logika Skor 4 Tingkat yang sama
		selectQuery = selectQuery.Select(`
			users.*, 
			CASE 
				WHEN users.user_id = ? THEN 3
				WHEN viewer_follows.following_status = 'accepted' THEN 2
				WHEN viewer_follows.following_status = 'pending' THEN 1
				ELSE 0 
			END AS priority_score`, *viewerID).
			Joins("LEFT JOIN user_follows AS viewer_follows ON viewer_follows.user_followed_id = users.user_id AND viewer_follows.user_following_id = ?", *viewerID).
			Order("priority_score DESC")
	}

	err := selectQuery.
		Preload("Profile").
		Order("users.username ASC").
		Limit(limit).
		Offset(offset).
		Find(&users).Error

	return users, total, err
}

func (r *userRepository) AcceptAllPendingFollows(userID uint) (int64, error) {
	// Update semua yang pending menjadi accepted untuk user yang dituju (userID)
	result := r.db.Model(&models.UserFollow{}).
		Where("user_followed_id = ? AND following_status = ?", userID, "pending").
		Update("following_status", "accepted")

	return result.RowsAffected, result.Error
}

func (r *userRepository) GetPendingFollowerIDs(userID uint) ([]uint, error) {
    var ids []uint
    // Mengambil semua user_following_id (orang yang follow) yang statusnya pending untuk userID ini
    err := r.db.Model(&models.UserFollow{}).
        Where("user_followed_id = ? AND following_status = ?", userID, "pending").
        Pluck("user_following_id", &ids).Error
    
    return ids, err
}

func (r *userRepository) BulkUpdateUserStat(db *gorm.DB, userIDs []uint, columnName string, amount int) error {
    if len(userIDs) == 0 {
        return nil
    }
    // Update total_following untuk SEMUA user yang ada di dalam list ID
    return db.Model(&models.UserStat{}).
        Where("user_id IN ?", userIDs).
        Update(columnName, gorm.Expr(columnName+" + ?", amount)).Error
}

func (r *userRepository) SyncUserStats(db *gorm.DB, userID uint, field string, amount int) error {
	fFollowers := "COALESCE(user_stats.total_followers, 0)"
	fPosts := "COALESCE(user_stats.total_posts, 0)"
	fBadges := "COALESCE(user_stats.total_badges, 0)"
	fAchievements := "COALESCE(user_stats.total_achievements, 0)" // Tambahkan ini

	// Update field yang sedang dikirim
	if field == "total_followers" { fFollowers = fmt.Sprintf("(%s + %d)", fFollowers, amount) }
	if field == "total_posts" { fPosts = fmt.Sprintf("(%s + %d)", fPosts, amount) }
	if field == "total_badges" { fBadges = fmt.Sprintf("(%s + %d)", fBadges, amount) }
	if field == "total_achievements" { fAchievements = fmt.Sprintf("(%s + %d)", fAchievements, amount) }

	// Rumus baru: Badge bobot 10, Achievement bobot 5
	hotScoreFormula := fmt.Sprintf(`
		(%s * 2) + (%s * 5) + (%s * 10) + (%s * 5)
	`, fFollowers, fPosts, fBadges, fAchievements)

	return db.Model(&models.UserStat{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
		field:       gorm.Expr("user_stats."+field+" + ?", amount),
		"hot_score":  gorm.Expr(hotScoreFormula),
		"updated_at": time.Now(),
	}).Error
}

func (r *userRepository) UpdatePassword(userID uint, newHash string) error {
	return r.db.Model(&models.User{}).Where("user_id = ?", userID).Update("password_hash", newHash).Error
}

func (r *userRepository) UpdateLastLogin(userID uint) error {
	// Kita gunakan Model(&models.User{}) untuk menunjuk tabel users
	// Lalu kita update kolom last_login dengan waktu sekarang
	return r.db.Model(&models.User{}).Where("user_id = ?", userID).Update("last_login", time.Now()).Error
}