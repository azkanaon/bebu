package repositories

import (
	"backend-bebu/internal/models"

	"gorm.io/gorm"
)

// 🔥 Struct temporary khusus untuk menampung hasil query raw termasuk kolom score debug
type ScoredUserRow struct {
	models.User
	MatchScore    int `gorm:"column:match_score"`
	MutualScore   int `gorm:"column:mutual_score"`
	GenreScore    int `gorm:"column:genre_score"`
	ActivityScore int `gorm:"column:activity_score"`
}

type RecommendationRepository interface {
	GetScoredFriendRecommendations(currentUserID uint, limit int) ([]ScoredUserRow, error)
}

type recommendationRepository struct {
	db *gorm.DB
}

func NewRecommendationRepository(db *gorm.DB) RecommendationRepository {
	return &recommendationRepository{db: db}
}

func (r *recommendationRepository) GetScoredFriendRecommendations(currentUserID uint, limit int) ([]ScoredUserRow, error) {
	var rows []ScoredUserRow

	// Kita bongkar COALESCE ke dalam kolom SELECT tersendiri agar nilainya terlihat jelas
	query := `
		SELECT u.*, 
			COALESCE(mutual_f.score, 0) AS mutual_score,
			COALESCE(same_cat.score, 0) AS genre_score,
			COALESCE(act.score, 0) AS activity_score,
			-- Total akumulasi maksimal terkunci di 40 + 40 + 20 = 100 Poin
			(COALESCE(mutual_f.score, 0) + COALESCE(same_cat.score, 0) + COALESCE(act.score, 0)) AS match_score
		FROM users u
		
		-- 1. Hitung Mutual Friends Score (1 Mutual = 8 Poin, Maksimal Dikunci di 40 Poin)
		LEFT JOIN (
			SELECT f2.user_followed_id AS target_user_id, 
				LEAST(COUNT(f2.user_following_id) * 8, 40) AS score
			FROM user_follows f1
			JOIN user_follows f2 ON f1.user_followed_id = f2.user_following_id
			WHERE f1.user_following_id = ? AND f1.following_status = 'accepted' AND f2.following_status = 'accepted'
			GROUP BY f2.user_followed_id
		) mutual_f ON u.user_id = mutual_f.target_user_id

		-- 2. Hitung Kesamaan Kategori (1 Kategori Sama = 4 Poin, Maksimal 10 Kategori * 4 = 40 Poin)
		LEFT JOIN (
			SELECT uc2.user_id AS target_user_id, COUNT(uc2.category_id) * 4 AS score
			FROM user_categories uc1
			JOIN user_categories uc2 ON uc1.category_id = uc2.category_id
			WHERE uc1.user_id = ? AND uc2.user_id != ?
			GROUP BY uc2.user_id
		) same_cat ON u.user_id = same_cat.target_user_id

		-- 3. Hitung Keaktifan User (1 Post = 2 Poin, Maksimal Dikunci di 20 Poin)
		LEFT JOIN (
			SELECT user_id AS target_user_id, 
				LEAST(total_posts * 2, 20) AS score
			FROM user_stats
		) act ON u.user_id = act.target_user_id

		WHERE u.user_id != ? 
		AND u.is_active = true 
		AND u.status = 'active'
		AND u.deleted_at IS NULL
		AND u.user_id NOT IN (
			-- Ditambahkan status 'pending' agar user yang sedang menunggu konfirmasi tidak muncul lagi
			SELECT user_followed_id FROM user_follows 
			WHERE user_following_id = ? AND following_status IN ('accepted', 'pending')
		)
		-- Mengurutkan skor tertinggi, lalu mengacak user dengan poin kembar secara dinamis
		ORDER BY match_score DESC, RANDOM()
		LIMIT ?
	`

	// Jalankan query ke struct ScoredUserRow, GORM akan otomatis melakukan Preload ke dalam models.User yang ada di dalamnya
	err := r.db.Raw(query, currentUserID, currentUserID, currentUserID, currentUserID, currentUserID, limit).
		Preload("Profile").
		Preload("Stats").
		Find(&rows).Error

	if err != nil {
		return nil, err
	}

	return rows, nil
}