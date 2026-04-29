package repositories

import (
	"backend-bebu/internal/models"

	"gorm.io/gorm"
)

type PostRepository struct {
	db *gorm.DB
}

func NewPostRepository(db *gorm.DB) *PostRepository {
	return &PostRepository{db: db}
}

func (r *PostRepository) GetAllPosts() ([]models.Post, error) {
	var posts []models.Post

	err := r.db.Debug().
		Preload("User").
		Preload("User.Profile").
		Preload("Book").
		Preload("Book.BookAuthors.Author").
		Preload("Book.BookGenres.Genre").
		Preload("Stat").
		Where("publish_status = ?", "published").
		Order("created_at DESC").
		Find(&posts).Error

	return posts, err
}