package repositories

import (
	"backend-bebu/internal/models"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type SearchRepository interface {
	SearchBooks(query string, page, limit int) ([]models.Book, int64, error)
	SearchUsers(query string, viewerID *uint, page, limit int) ([]models.User, int64, error)
	SearchPosts(query string, page, limit int) ([]models.Post, int64, error)
	SaveSearchHistory(userID uint, query string) error
	GetRecentSearches(userID uint, limit int) ([]models.SearchLog, error)
	DeleteSearchHistory(userID uint, logID uint) error
	ClearAllSearchHistory(userID uint) error
}

type searchRepository struct {
	db *gorm.DB
}

func NewSearchRepository(db *gorm.DB) SearchRepository {
	return &searchRepository{db: db}
}

// 1. Pencarian Buku (Urut hot_score)
func (r *searchRepository) SearchBooks(query string, page, limit int) ([]models.Book, int64, error) {
	var books []models.Book
	var total int64
	offset := (page - 1) * limit

	baseQuery := r.db.Model(&models.Book{}).
		Joins("LEFT JOIN book_stats ON book_stats.book_id = books.book_id").
		Where("LOWER(books.title) LIKE ?", "%"+strings.ToLower(query)+"%")

	baseQuery.Count(&total)

	err := baseQuery.
		Select("books.*, COALESCE(book_stats.hot_score, 0) as score").
		Preload("BookAuthors.Author").
		Order("score DESC, books.title ASC").
		Limit(limit).Offset(offset).
		Find(&books).Error

	return books, total, err
}

// 2. Pencarian User (Urut Mutual Follow + hot_score)
func (r *searchRepository) SearchUsers(query string, viewerID *uint, page, limit int) ([]models.User, int64, error) {
	var users []models.User
	var total int64
	offset := (page - 1) * limit

	baseQuery := r.db.Model(&models.User{}).
		Joins("JOIN user_profiles ON user_profiles.user_id = users.user_id").
		Joins("LEFT JOIN user_stats ON user_stats.user_id = users.user_id").
		Where("LOWER(users.username) LIKE ? OR LOWER(user_profiles.display_name) LIKE ?", 
			"%"+strings.ToLower(query)+"%", "%"+strings.ToLower(query)+"%")

	baseQuery.Count(&total)

	selectFields := "users.*, COALESCE(user_stats.hot_score, 0) as global_score"
	orderBy := "global_score DESC"

	if viewerID != nil {
		selectFields = fmt.Sprintf(`%s, 
			CASE 
				WHEN users.user_id = %d THEN 3
				WHEN v_f.following_status = 'accepted' THEN 2
				WHEN v_f.following_status = 'pending' THEN 1
				ELSE 0 
			END AS priority_score`, selectFields, *viewerID)
		
		baseQuery = baseQuery.Joins("LEFT JOIN user_follows AS v_f ON v_f.user_followed_id = users.user_id AND v_f.user_following_id = ?", *viewerID)
		orderBy = "priority_score DESC, global_score DESC"
	}

	err := baseQuery.Select(selectFields).
		Preload("Profile").
		Order(orderBy).
		Limit(limit).Offset(offset).
		Find(&users).Error

	return users, total, err
}

// 3. Pencarian Post (Urut hot_score)
func (r *searchRepository) SearchPosts(query string, page, limit int) ([]models.Post, int64, error) {
	var posts []models.Post
	var total int64
	offset := (page - 1) * limit

	baseQuery := r.db.Model(&models.Post{}).
		Joins("LEFT JOIN post_stats ON post_stats.post_id = posts.post_id").
		Where("publish_status = ?", "published").
		Where("LOWER(description) LIKE ?", "%"+strings.ToLower(query)+"%")

	baseQuery.Count(&total)

	err := baseQuery.Select("posts.*, COALESCE(post_stats.hot_score, 0) as score").
		Preload("User.Profile").
		Preload("Stats").
		Preload("Book").
		Order("score DESC, posts.created_at DESC").
		Limit(limit).Offset(offset).
		Find(&posts).Error

	return posts, total, err
}

func (r *searchRepository) SaveSearchHistory(userID uint, query string) error {
	trimmed := strings.TrimSpace(query)
	
	// PENGAMAN: Jika entah bagaimana masuk teks < 2 huruf, batalkan proses
	if len(trimmed) < 2 {
		return nil // Return nil karena ini bukan error sistem, hanya data yang tidak layak simpan
	}

	normalized := strings.ToLower(trimmed)
	limit := 10

	// 1. Jalankan Transaksi agar proses simpan dan hapus sinkron
	return r.db.Transaction(func(tx *gorm.DB) error {
		
		// 2. UPSERT: Simpan atau Update waktu (Deduplikasi)
		err := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "user_id"}, {Name: "query_text"}},
			DoUpdates: clause.Assignments(map[string]interface{}{"updated_at": time.Now()}),
		}).Create(&models.SearchLog{
			UserID:          userID,
			QueryText:       query,
			QueryNormalized: normalized,
		}).Error

		if err != nil {
			return err
		}

		// 3. CLEANUP: Hapus item ke-11 dan seterusnya
		// Query: Hapus dari search_logs di mana ID-nya tidak masuk dalam 10 besar terbaru
		subQuery := tx.Model(&models.SearchLog{}).
			Select("search_log_id").
			Where("user_id = ?", userID).
			Order("updated_at DESC").
			Limit(limit)

		return tx.Where("user_id = ? AND search_log_id NOT IN (?)", userID, subQuery).
			Delete(&models.SearchLog{}).Error
	})
}

func (r *searchRepository) GetRecentSearches(userID uint, limit int) ([]models.SearchLog, error) {
	var logs []models.SearchLog
	err := r.db.Where("user_id = ?", userID).
		Order("updated_at DESC"). // Paling baru di atas
		Limit(limit).
		Find(&logs).Error
	return logs, err
}

func (r *searchRepository) DeleteSearchHistory(userID uint, logID uint) error {
	// Kita tambahkan user_id di WHERE clause sebagai pengaman (Ownership Check)
	result := r.db.Where("user_id = ? AND search_log_id = ?", userID, logID).Delete(&models.SearchLog{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *searchRepository) ClearAllSearchHistory(userID uint) error {
	return r.db.Where("user_id = ?", userID).Delete(&models.SearchLog{}).Error
}