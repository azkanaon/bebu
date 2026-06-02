package repositories

import (
	"backend-bebu/internal/models"

	"gorm.io/gorm"
)

type BookSubmissionRepository interface {
	WithTx(tx *gorm.DB) BookSubmissionRepository
	CreateSubmission(submission *models.BookSubmission) error
	GetSubmissionsByUserID(userID uint, status string, page, limit int) ([]models.BookSubmission, int64, error)
	FindSubmissionByID(id uint) (*models.BookSubmission, error)
	UpdateSubmission(tx *gorm.DB, submission *models.BookSubmission) error
	DeleteSubmissionAuthors(submissionID uint) error
	DeleteSubmissionGenres(id uint) error
	DeleteSubmission(id uint) error
}

type bookSubmissionRepository struct {
	db *gorm.DB
}

func NewBookSubmissionRepository(db *gorm.DB) BookSubmissionRepository {
	return &bookSubmissionRepository{db: db}
}

func (r *bookSubmissionRepository) WithTx(tx *gorm.DB) BookSubmissionRepository {
	// Mengembalikan instance baru dengan koneksi transaksi (tx)
	return &bookSubmissionRepository{db: tx}
}

func (r *bookSubmissionRepository) CreateSubmission(submission *models.BookSubmission) error {
	return r.db.Create(submission).Error
}

func (r *bookSubmissionRepository) GetSubmissionsByUserID(userID uint, status string, page, limit int) ([]models.BookSubmission, int64, error) {
	var submissions []models.BookSubmission
	var total int64
	offset := (page - 1) * limit

	query := r.db.Model(&models.BookSubmission{}).Where("submitted_by_user_id = ?", userID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)

	err := query.Preload("SubmissionAuthors.Author"). 
		Preload("SubmissionGenres.Genre").
		Offset(offset).Limit(limit).
		Order("created_at DESC").
		Find(&submissions).Error

	return submissions, total, err
}

func (r *bookSubmissionRepository) FindSubmissionByID(id uint) (*models.BookSubmission, error) {
	var sub models.BookSubmission
	// Preload relasi agar kita bisa tahu data lama penulis/genre
	err := r.db.Preload("SubmissionAuthors").Preload("SubmissionGenres").First(&sub, id).Error
	return &sub, err
}

func (r *bookSubmissionRepository) UpdateSubmission(tx *gorm.DB, sub *models.BookSubmission) error {
	return tx.Save(sub).Error
}

func (r *bookSubmissionRepository) DeleteSubmissionAuthors(id uint) error {
	return r.db.Exec("DELETE FROM book_submission_authors WHERE book_submission_id = ?", id).Error
}

func (r *bookSubmissionRepository) DeleteSubmissionGenres(id uint) error {
	return r.db.Exec("DELETE FROM book_submission_genres WHERE book_submission_id = ?", id).Error
}

func (r *bookSubmissionRepository) DeleteSubmission(id uint) error {
	// Ini akan melakukan Soft Delete jika ada DeletedAt, atau Hard Delete jika tidak ada.
	return r.db.Delete(&models.BookSubmission{}, id).Error
}