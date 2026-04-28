package repositories

import (
	"backend-bebu/internal/models"

	"gorm.io/gorm"
)

type BookRepository struct {
	db *gorm.DB
}

func NewBookRepository(db *gorm.DB) *BookRepository {
	return &BookRepository{db}
}

func (r *BookRepository) FindAll() ([]models.Book, error) {
	var books []models.Book

	err := r.db.
		Select("book_id, title").
		Find(&books).Error

	return books, err
}