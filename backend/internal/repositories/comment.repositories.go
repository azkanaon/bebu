package repositories

import (
	"backend-bebu/internal/models"
	"gorm.io/gorm"
	"errors"
)

type CommentRepository interface {
	CreateComment(comment *models.PostComment) error
	GetCommentByID(id uint) (*models.PostComment, error)
	UpdateCommentCount(postID uint, increment int) error
	ToggleLikeComment(userID, commentID uint) (bool, error)
	DeleteCommentRecursive(commentID uint, userID uint) error
	CountReplies(commentID uint) (int64, error)
}

type commentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) CommentRepository {
	return &commentRepository{db}
}

func (r *commentRepository) CreateComment(comment *models.PostComment) error {
	// GORM akan otomatis mengurus parent_comment_id jika nil atau berisi ID
	return r.db.Create(comment).Error
}

func (r *commentRepository) GetCommentByID(id uint) (*models.PostComment, error) {
	var comment models.PostComment
	err := r.db.Preload("User.Profile").First(&comment, id).Error
	return &comment, err
}

func (r *commentRepository) UpdateCommentCount(postID uint, increment int) error {
    return r.db.Model(&models.PostStat{}).
        Where("post_id = ?", postID).
        Update("comment_count", gorm.Expr("comment_count + ?", increment)).
        Error
}

func (r *commentRepository) ToggleLikeComment(userID, commentID uint) (bool, error) {
	var like models.PostCommentLike
	// Cek apakah sudah ada like
	result := r.db.Where("user_id = ? AND post_comment_id = ?", userID, commentID).First(&like)

	if result.Error == nil {
		// Jika ada, hapus (Unlike)
		if err := r.db.Delete(&like).Error; err != nil {
			return false, err
		}
		// Kurangi counter di tabel comments
		r.db.Model(&models.PostComment{}).Where("post_comment_id = ?", commentID).
			Update("like_count", gorm.Expr("like_count - ?", 1))
		return false, nil
	} else {
		// Jika tidak ada, buat baru (Like)
		newLike := models.PostCommentLike{
			UserID:        userID,
			PostCommentID: commentID,
		}
		if err := r.db.Create(&newLike).Error; err != nil {
			return false, err
		}
		// Tambah counter di tabel comments
		r.db.Model(&models.PostComment{}).Where("post_comment_id = ?", commentID).
			Update("like_count", gorm.Expr("like_count + ?", 1))
		return true, nil
	}
}

func (r *commentRepository) CountReplies(commentID uint) (int64, error) {
    var count int64
    err := r.db.Model(&models.PostComment{}).Where("parent_comment_id = ?", commentID).Count(&count).Error
    return count, err
}

func (r *commentRepository) DeleteCommentRecursive(commentID uint, userID uint) error {
    return r.db.Transaction(func(tx *gorm.DB) error {
        // 1. Cari komentar untuk memastikan kepemilikan
        var comment models.PostComment
        if err := tx.Where("post_comment_id = ? AND user_id = ?", commentID, userID).First(&comment).Error; err != nil {
            if errors.Is(err, gorm.ErrRecordNotFound) {
                return errors.New("komentar tidak ditemukan atau Anda tidak memiliki akses")
            }
            return err
        }

        // 2. Hapus semua balasan (Replies) secara rekursif
        // Kita mencari semua yang parent_id-nya adalah commentID ini
        if err := tx.Where("parent_comment_id = ?", commentID).Delete(&models.PostComment{}).Error; err != nil {
            return err
        }

        // 3. Hapus komentar utamanya
        if err := tx.Delete(&comment).Error; err != nil {
            return err
        }

        return nil
    })
}