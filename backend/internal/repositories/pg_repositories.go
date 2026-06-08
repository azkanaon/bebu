package repositories

import (
	"backend-bebu/internal/domain"
	"backend-bebu/internal/models"
	"context"
	"errors"
	"time"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type pgRepository struct {
	db *gorm.DB
}

func NewPostgresRepository(db *gorm.DB) domain.PostgresRepository {
	return &pgRepository{db: db}
}

func (r *pgRepository) AddExpWithTransaction(ctx context.Context, sourceID *uint, userID uint, amount int, sourceType string) (interface{}, error) {
	var expTx models.ExpTransaction

	// Jalankan transaksi database agar jika salah satu proses gagal, semua dibatalkan
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// LANGKAH 1: Insert log ke tabel exp_transactions
		expTx = models.ExpTransaction{
			UserID:     userID,
			SourceID:   sourceID,
			SourceType: sourceType,
			ExpAmount:  amount,
			CreatedAt:  time.Now(),
		}
		if err := tx.Create(&expTx).Error; err != nil {
			return err
		}

		// LANGKAH 2: Cari tahu total EXP user saat ini (akumulasi dari semua transaksinya)
		var totalExp int
		err := tx.Model(&models.ExpTransaction{}).
			Where("user_id = ?", userID).
			Select("COALESCE(SUM(exp_amount), 0)").
			Scan(&totalExp).Error
		if err != nil {
			return err
		}

		// LANGKAH 3: Cari level_master_id yang cocok berdasarkan totalExp saat ini
		var matchedLevel models.LevelMaster
		err = tx.Where("? BETWEEN min_total_exp AND max_total_exp", totalExp).
			First(&matchedLevel).Error
		
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				// Fallback aman: jika melewati level maksimum, ambil master level yang paling tinggi
				if errMax := tx.Order("level_numbers DESC").First(&matchedLevel).Error; errMax != nil {
					return errMax
				}
			} else {
				return err
			}
		}

		// LANGKAH 4: Hitung sisa EXP di level saat ini (untuk keperluan progress bar di FE)
		currentLevelExp := totalExp - matchedLevel.MinTotalExp
		nextLevelExp := matchedLevel.MaxTotalExp - matchedLevel.MinTotalExp + 1

		// LANGKAH 5: UPSERT (Insert atau Update) ke tabel user_levels
		var userLevel models.UserLevel
		err = tx.Where("user_id = ?", userID).First(&userLevel).Error

		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Jika belum pernah ada datanya, buat baris baru (INSERT)
			userLevel = models.UserLevel{
				UserID:          userID,
				LevelMasterID:   matchedLevel.LevelMasterID, // Ini akan berisi ID dinamis (81, 82, dst)
				TotalExp:        totalExp,
				CurrentLevelExp: currentLevelExp,
				NextLevelExp:    nextLevelExp,
				UpdatedAt:       time.Now(),
			}
			if errCreate := tx.Create(&userLevel).Error; errCreate != nil {
				return errCreate
			}
		} else if err == nil {
			// Jika sudah ada, perbarui nilainya (UPDATE)
			errUpdate := tx.Model(&userLevel).Updates(map[string]interface{}{
				"level_master_id":   matchedLevel.LevelMasterID,
				"total_exp":         totalExp,
				"current_level_exp": currentLevelExp,
				"next_level_exp":    nextLevelExp,
				"updated_at":        time.Now(),
			}).Error
			if errUpdate != nil {
				return errUpdate
			}
		} else {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return expTx, nil
}

func (r *pgRepository) GetUsersProfileMap(ctx context.Context, userIDs []uint) (map[uint]models.User, error) {
	if len(userIDs) == 0 {
		return map[uint]models.User{}, nil // Sekarang mengembalikan map kosong dari models.User
	}

	var users []models.User
	// Ambil data user beserta relasi Profile-nya (Eager Loading)
	err := r.db.WithContext(ctx).
		Preload("Profile").
		Where("user_id IN ?", userIDs).
		Find(&users).Error

	if err != nil {
		return nil, err
	}

	// Konversi ke map untuk mempermudah pencarian O(1) di Service
	userMap := make(map[uint]models.User)
	for _, user := range users {
		userMap[user.UserID] = user
	}

	return userMap, nil
}

func (r *pgRepository) UpsertRankings(ctx context.Context, rankings []models.UserRanking) error {
    if len(rankings) == 0 {
        return nil
    }
    return r.db.WithContext(ctx).
        Clauses(clause.OnConflict{
            Columns: []clause.Column{
                {Name: "user_id"},
                {Name: "period_type"},
                {Name: "period_key"},
            },
            DoUpdates: clause.AssignmentColumns([]string{"total_exp", "global_rank", "updated_at"}),
        }).
        CreateInBatches(&rankings, 100).Error
}