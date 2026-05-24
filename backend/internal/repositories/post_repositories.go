package repositories

import (
	"backend-bebu/internal/models"
	"fmt"
	"time"

	"errors"

	"gorm.io/gorm"
)

type PostRepository interface {
	WithTx(tx *gorm.DB) PostRepository
	GetPosts(userID uint, tab string, cursor uint, limit int, categoryID uint) ([]models.Post, error)
	CreatePost(post *models.Post) (*models.Post, error)
	FindPostByID(id uint) (*models.Post, error)
	GetPostCategories(postID uint) ([]uint, error)
	DeletePostWithTx(tx *gorm.DB, postID uint, userID uint) error
	ClearPostCategories(tx *gorm.DB, postID uint) error
	DecrementCategoryUsage(tx *gorm.DB, categoryIDs []uint) error
	GetPostsByUserID(userID uint, page, limit int) ([]models.Post, int64, error)
	GetLikedPostsByUserID(userID uint, page, limit int) ([]models.Post, int64, error)
	GetSavedPostsByUserID(userID uint, page, limit int) ([]models.Post, int64, error)
	ToggleLike(postID uint, userID uint) (bool, error)
	ToggleSave(userID uint, postID uint) (bool, error)
	UpdateSaveCount(postID uint, increment int) error
	GetCommentsByPostID(postID uint, userID uint) ([]models.PostComment, error)
	DecrementCommentCountByAmount(postID uint, amount int) error

	IsLiked(postID, userID uint) (bool, error)
    AddLike(db *gorm.DB, postID, userID uint) error
    DeleteLike(db *gorm.DB, postID, userID uint) error

    IsSaved(postID, userID uint) (bool, error)
    AddSave(db *gorm.DB, postID, userID uint) error
    DeleteSave(db *gorm.DB, postID, userID uint) error
    
    SyncPostStats(db *gorm.DB, postID uint, field string, amount int) error
}

type postRepository struct {
	db *gorm.DB
}

func NewPostRepository(db *gorm.DB) PostRepository {
	return &postRepository{db: db}
}

func (r *postRepository) WithTx(tx *gorm.DB) PostRepository {
	// Buat klon dari repository saat ini, tapi ganti koneksi db-nya dengan tx.
	return &postRepository{db: tx}
}

func (r *postRepository) GetPosts(userID uint, tab string, cursor uint, limit int, categoryID uint) ([]models.Post, error) {
    var posts []models.Post

    query := r.db.Debug().
        Select(`posts.*, 
            (SELECT EXISTS (SELECT 1 FROM post_likes WHERE post_id = posts.post_id AND user_id = ?)) as is_liked,
            (SELECT EXISTS (SELECT 1 FROM post_saves WHERE post_id = posts.post_id AND user_id = ?)) as is_saved`,
            userID, userID).
        Preload("User.Profile").
        Preload("Book.BookAuthors.Author"). 
        Preload("Book.BookGenres.Genre").
        Preload("Stats").
        Preload("Categories").
        Preload("Comments", func(db *gorm.DB) *gorm.DB {
            return db.Where("post_comment_id IN (SELECT post_comment_id FROM (SELECT post_comment_id, ROW_NUMBER() OVER (PARTITION BY post_id ORDER BY created_at DESC) as rn FROM post_comments WHERE parent_comment_id IS NULL) tmp WHERE rn <= 3)")
        }).
        Preload("Comments.User.Profile").
        Where("publish_status = ?", "published")

    // --- Filtering ---
    if categoryID > 0 {
        query = query.Where(`
            posts.post_id IN (SELECT post_id FROM post_categories WHERE category_id = ?) 
            OR 
            posts.book_id IN (SELECT book_id FROM book_genres WHERE genre_id = (
                SELECT genre_id FROM genres WHERE genre_name = (SELECT category_name FROM categories WHERE category_id = ?)
            ))`, categoryID, categoryID)
    }

    // Filter Tab Following
    if tab == "following" && userID != 0 {
        followingSubquery := r.db.Model(&models.UserFollow{}).
            Select("user_followed_id").
            Where("user_following_id = ? AND following_status = ?", userID, "accepted")
        query = query.Where("user_id IN (?)", followingSubquery)
    }

    // Cursor Pagination
    if cursor > 0 {
        query = query.Where("post_id < ?", cursor)
    }

    err := query.Order("post_id DESC").Limit(limit).Find(&posts).Error

    // Map TotalLikes
    for i := range posts {
        if posts[i].Stats != nil {
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

func (r *postRepository) CreatePost(post *models.Post) (*models.Post, error) {
	result := r.db.Create(post)
	if result.Error != nil {
		return nil, result.Error
	}
	
	return post, nil
}

func (r *postRepository) FindPostByID(id uint) (*models.Post, error) {
	var post models.Post
	// Cukup cari berdasarkan Primary Key (post_id)
	err := r.db.First(&post, id).Error
	return &post, err
}

func (r *postRepository) GetPostCategories(postID uint) ([]uint, error) {
	var categoryIDs []uint
	err := r.db.Table("post_categories").
		Where("post_id = ?", postID).
		Pluck("category_id", &categoryIDs).Error
	return categoryIDs, err
}

func (r *postRepository) DeletePostWithTx(tx *gorm.DB, postID uint, userID uint) error {
	result := tx.Where("post_id = ? AND user_id = ?", postID, userID).Delete(&models.Post{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("post not found or unauthorized")
	}
	return nil
}

func (r *postRepository) ClearPostCategories(tx *gorm.DB, postID uint) error {
	return tx.Exec("DELETE FROM post_categories WHERE post_id = ?", postID).Error
}

func (r *postRepository) DecrementCategoryUsage(tx *gorm.DB, categoryIDs []uint) error {
	if len(categoryIDs) == 0 {
		return nil
	}
	return tx.Model(&models.Category{}).
		Where("category_id IN ?", categoryIDs).
		Update("usage_count", gorm.Expr("usage_count - 1")).Error
}

func (r *postRepository) GetLikedPostsByUserID(userID uint, page, limit int) ([]models.Post, int64, error) {
	var posts []models.Post
	var total int64
	offset := (page - 1) * limit

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
    
    // Ambil SEMUA komentar untuk post ini tanpa filter parent_id
    err := r.db.Debug().
        Where("post_id = ?", postID).
        Preload("User.Profile").
        Preload("Likes", "user_id = ?", userID).
        Order("created_at ASC"). // ASC agar parent biasanya diproses lebih dulu
        Find(&comments).Error
        
    return comments, err
}

func (r *postRepository) DecrementCommentCountByAmount(postID uint, amount int) error {
	return r.db.Model(&models.PostStat{}).
		Where("post_id = ?", postID).
		Update("comment_count", gorm.Expr("comment_count - ?", amount)).Error
}

func (r *postRepository) SyncPostStats(db *gorm.DB, postID uint, field string, amount int) error {
	fLikes := "COALESCE(post_stats.like_count, 0)"
	fComments := "COALESCE(post_stats.comment_count, 0)"
	fSaves := "COALESCE(post_stats.save_count, 0)"

	if field == "like_count" { fLikes = fmt.Sprintf("(%s + %d)", fLikes, amount) }
	if field == "comment_count" { fComments = fmt.Sprintf("(%s + %d)", fComments, amount) }
	if field == "save_count" { fSaves = fmt.Sprintf("(%s + %d)", fSaves, amount) }

	hotScoreFormula := fmt.Sprintf(`
		(%s * 1) + (%s * 3) + (%s * 5)
	`, fLikes, fComments, fSaves)

	return db.Model(&models.PostStat{}).Where("post_id = ?", postID).Updates(map[string]interface{}{
		field:       gorm.Expr("post_stats."+field+" + ?", amount),
		"hot_score":  gorm.Expr(hotScoreFormula),
		"updated_at": time.Now(),
	}).Error
}

func (r *postRepository) IsLiked(postID, userID uint) (bool, error) {
    var count int64
    err := r.db.Model(&models.PostLike{}).Where("post_id = ? AND user_id = ?", postID, userID).Count(&count).Error
    return count > 0, err
}

func (r *postRepository) AddLike(db *gorm.DB, postID, userID uint) error {
    return db.Create(&models.PostLike{PostID: postID, UserID: userID}).Error
}

func (r *postRepository) DeleteLike(db *gorm.DB, postID, userID uint) error {
    return db.Where("post_id = ? AND user_id = ?", postID, userID).Delete(&models.PostLike{}).Error
}

func (r *postRepository) IsSaved(postID, userID uint) (bool, error) {
    var count int64
    err := r.db.Model(&models.PostSave{}).Where("post_id = ? AND user_id = ?", postID, userID).Count(&count).Error
    return count > 0, err
}

func (r *postRepository) AddSave(db *gorm.DB, postID, userID uint) error {
    return db.Create(&models.PostSave{PostID: postID, UserID: userID}).Error
}

func (r *postRepository) DeleteSave(db *gorm.DB, postID, userID uint) error {
    return db.Where("post_id = ? AND user_id = ?", postID, userID).Delete(&models.PostSave{}).Error
}
