package repositories

import (
	"backend-bebu/internal/models"

	"gorm.io/gorm"
)

// --- 1. Interface (Publik, tanpa 'I') ---
// Mendefinisikan kontrak untuk PostRepository.
type PostRepository interface {
	GetAllPosts(userID uint) ([]models.Post, error)
	CreatePost(post *models.Post) (*models.Post, error)
	GetPostsByUserID(userID uint, page, limit int) ([]models.Post, int64, error)
	GetLikedPostsByUserID(userID uint, page, limit int) ([]models.Post, int64, error)
	GetSavedPostsByUserID(userID uint, page, limit int) ([]models.Post, int64, error)
	ToggleLike(postID uint, userID uint) (bool, error)
	ToggleSave(userID uint, postID uint) (bool, error)
	UpdateSaveCount(postID uint, increment int) error
	GetCommentsByPostID(postID uint, userID uint) ([]models.PostComment, error)
	DecrementCommentCountByAmount(postID uint, amount int) error

	WithTx(tx *gorm.DB) PostRepository
}

type postRepository struct {
	db *gorm.DB
}

func NewPostRepository(db *gorm.DB) PostRepository {
	return &postRepository{db: db}
}

func (r *postRepository) GetAllPosts(userID uint) ([]models.Post, error) {
	var posts []models.Post

	err := r.db.Debug().
        Select(`posts.*, 
            (SELECT EXISTS (SELECT 1 FROM post_likes WHERE post_id = posts.post_id AND user_id = ?)) as is_liked,
            (SELECT EXISTS (SELECT 1 FROM post_saves WHERE post_id = posts.post_id AND user_id = ?)) as is_saved`,
            userID, userID).
        Preload("User.Profile").
        Preload("Book").
        Preload("Book.BookAuthors.Author"). 
        Preload("Book.BookGenres.Genre").
        Preload("Stats").
        Preload("Comments", func(db *gorm.DB) *gorm.DB {
            return db.Where("post_comment_id IN (SELECT post_comment_id FROM (SELECT post_comment_id, ROW_NUMBER() OVER (PARTITION BY post_id ORDER BY created_at DESC) as rn FROM post_comments WHERE parent_comment_id IS NULL) tmp WHERE rn <= 2)")
        }).
        Preload("Comments.User.Profile").
        Where("publish_status = ?", "published").
        Order("created_at DESC").
        Find(&posts).Error

	for i := range posts {
		if posts[i].Stats != nil {
			// ✅ GUNAKAN TotalLikes, karena Likes sudah dipakai oleh slice []PostLike
			posts[i].TotalLikes = posts[i].Stats.LikeCount
		}
	}

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

func (r *postRepository) ToggleLike(postID uint, userID uint) (bool, error) {
	tx := r.db.Begin()
	var like models.PostLike
	isLiked := false

	// 1. Cek apakah sudah dilike
	if err := tx.Where("post_id = ? AND user_id = ?", postID, userID).First(&like).Error; err == nil {
		// Jika ada -> Unlike
		tx.Delete(&like)
		tx.Model(&models.PostStat{}).Where("post_id = ?", postID).UpdateColumn("like_count", gorm.Expr("like_count - ?", 1))
	} else {
		// Jika tidak ada -> Like
		tx.Create(&models.PostLike{PostID: postID, UserID: userID})
		tx.Model(&models.PostStat{}).Where("post_id = ?", postID).UpdateColumn("like_count", gorm.Expr("like_count + ?", 1))
		isLiked = true
	}
	return isLiked, tx.Commit().Error
}

func (r *postRepository) ToggleSave(userID uint, postID uint) (bool, error) {
	var save models.PostSave
	// Cek apakah sudah di-save
	result := r.db.Where("user_id = ? AND post_id = ?", userID, postID).First(&save)

	if result.Error == nil {
		// Jika ditemukan (err nil), maka Unsave (Hapus)
		if err := r.db.Delete(&save).Error; err != nil {
			return false, err
		}
		return false, nil // false artinya sekarang tidak di-save
	}

	// Jika tidak ditemukan, maka Save (Tambah)
	newSave := models.PostSave{
		UserID: userID,
		PostID: postID,
	}
	if err := r.db.Create(&newSave).Error; err != nil {
		return false, err
	}
	return true, nil // true artinya sekarang di-save
}

func (r *postRepository) UpdateSaveCount(postID uint, increment int) error {
	return r.db.Model(&models.PostStat{}).
		Where("post_id = ?", postID).
		Update("save_count", gorm.Expr("save_count + ?", increment)).
		Error
}

func (r *postRepository) GetCommentsByPostID(postID uint, userID uint) ([]models.PostComment, error) {
	var comments []models.PostComment
	err := r.db.Debug().
		Where("post_id = ? AND parent_comment_id IS NULL", postID).
		Preload("User.Profile").
		Preload("Likes", "user_id = ?", userID).
		Preload("Replies.User.Profile").
		Preload("Replies.Likes", "user_id = ?", userID).
		Preload("Replies.Replies.User.Profile").
		Preload("Replies.Replies.Likes", "user_id = ?", userID).
		Order("created_at DESC").
		Find(&comments).Error
	return comments, err
}

func (r *postRepository) DecrementCommentCountByAmount(postID uint, amount int) error {
	return r.db.Model(&models.PostStat{}).
		Where("post_id = ?", postID).
		Update("comment_count", gorm.Expr("comment_count - ?", amount)).Error
}