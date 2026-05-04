package repositories

import (
	"backend-bebu/internal/models"

	"gorm.io/gorm"
)

// --- 1. Interface (Publik, tanpa 'I') ---
// Mendefinisikan kontrak untuk PostRepository.
type PostRepository interface {
	GetAllPosts() ([]models.Post, error)
	CreatePost(post *models.Post) (*models.Post, error)
	GetPostsByUserID(userID uint, page, limit int) ([]models.Post, int64, error)
	GetLikedPostsByUserID(userID uint, page, limit int) ([]models.Post, int64, error)
	GetSavedPostsByUserID(userID uint, page, limit int) ([]models.Post, int64, error)

	WithTx(tx *gorm.DB) PostRepository
}


// --- 2. Struct Implementasi (Privat) ---
// Nama struct diawali huruf kecil.
type postRepository struct {
	db *gorm.DB
}


// --- 3. "Pabrik" (Factory Function) ---
// Mengembalikan interface publik.
func NewPostRepository(db *gorm.DB) PostRepository {
	return &postRepository{db: db}
}

func (r *postRepository) GetAllPosts() ([]models.Post, error) {
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

func (r *postRepository) GetPostsByUserID(userID uint, page, limit int) ([]models.Post, int64, error) {
	var posts []models.Post
	var total int64
	offset := (page - 1) * limit

	query := r.db.Model(&models.Post{}).
		Where("user_id = ? AND publish_status = ?", userID, "published")

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = query.
		Preload("Stats").
		Preload("Book.BookAuthors.Author").
		Offset(offset).
		Limit(limit).
		Order("published_at DESC").
		Find(&posts).Error

	if err != nil {
		return nil, 0, err
	}

	return posts, total, err
}

// CreatePost menyimpan post baru ke database.
func (r *postRepository) CreatePost(post *models.Post) (*models.Post, error) {
	result := r.db.Create(post)
	if result.Error != nil {
		return nil, result.Error
	}
	// Anda mungkin perlu me-reload relasi Stats yang mungkin dibuat oleh trigger/logika lain
	// r.db.Preload("Stats").First(post, post.PostID)
	return post, nil
}

func (r *postRepository) WithTx(tx *gorm.DB) PostRepository {
	// Buat klon dari repository saat ini, tapi ganti koneksi db-nya dengan tx.
	return &postRepository{db: tx}
}

func (r *postRepository) GetLikedPostsByUserID(userID uint, page, limit int) ([]models.Post, int64, error) {
	var posts []models.Post
	var total int64
	offset := (page - 1) * limit

	// Kita perlu melakukan JOIN antara 'posts' dan 'post_likes'
	// untuk menemukan post yang di-like oleh userID.

	// Query dasar untuk menghitung total
	countQuery := r.db.Model(&models.Post{}).
		Joins("JOIN post_likes ON post_likes.post_id = posts.post_id").
		Where("post_likes.user_id = ? AND posts.publish_status = ?", userID, "published")

	err := countQuery.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Query untuk mengambil data halaman ini
	dataQuery := r.db.
		Joins("JOIN post_likes ON post_likes.post_id = posts.post_id").
		Where("post_likes.user_id = ? AND posts.publish_status = ?", userID, "published").
		Preload("User.Profile"). // Preload pemilik asli post
		Preload("Stats").
		Preload("Book.BookAuthors.Author").
		Offset(offset).
		Limit(limit).
		Order("post_likes.created_at DESC"). // Urutkan berdasarkan kapan post itu di-like
		Find(&posts)

	if dataQuery.Error != nil {
		return nil, 0, dataQuery.Error
	}

	return posts, total, nil
}

func (r *postRepository) GetSavedPostsByUserID(userID uint, page, limit int) ([]models.Post, int64, error) {
	var posts []models.Post
	var total int64
	offset := (page - 1) * limit

	// Query dasar untuk menghitung total
	countQuery := r.db.Model(&models.Post{}).
		Joins("JOIN post_saves ON post_saves.post_id = posts.post_id").
		Where("post_saves.user_id = ? AND posts.publish_status = ?", userID, "published")

	err := countQuery.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Query untuk mengambil data halaman ini
	dataQuery := r.db.
		Joins("JOIN post_saves ON post_saves.post_id = posts.post_id").
		Where("post_saves.user_id = ? AND posts.publish_status = ?", userID, "published").
		Preload("User.Profile"). // Preload pemilik asli post
		Preload("Stats").
		Preload("Book.BookAuthors.Author").
		Offset(offset).
		Limit(limit).
		Order("post_saves.created_at DESC"). // Urutkan berdasarkan kapan post itu di-save
		Find(&posts)

	if dataQuery.Error != nil {
		return nil, 0, dataQuery.Error
	}

	return posts, total, nil
}