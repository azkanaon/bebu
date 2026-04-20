// user_repository.go

package repositories

import (
	"backend-bebu/internal/models"
	"gorm.io/gorm"
)

type UserRepository interface {
	CreateUserAndProfile(user *models.User) (*models.User, error)
	FindByEmailOrUsername(emailOrUsername string) (*models.User, error)
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
	err := r.db.Where("email = ?", emailOrUsername).Or("username = ?", emailOrUsername).First(&user).Error
	if err != nil {
		return nil, err // gorm.ErrRecordNotFound jika tidak ada
	}
	return &user, nil
}