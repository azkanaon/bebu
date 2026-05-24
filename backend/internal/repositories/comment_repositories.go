package repositories

import (
	"backend-bebu/internal/models"

	"gorm.io/gorm"
)

type CommentRepository interface {
	WithTx(tx *gorm.DB) CommentRepository
	CreateComment(comment *models.PostComment) error
	GetCommentByID(id uint) (*models.PostComment, error)
	UpdateCommentCount(postID uint, increment int) error
	IsLiked(userID, commentID uint) (bool, error)
    AddLike(db *gorm.DB, userID, commentID uint) error
    DeleteLike(db *gorm.DB, userID, commentID uint) error
	DeleteCommentRecursive(commentID uint, userID uint) error
	CountReplies(commentID uint) (int64, error)
	CountAllRepliesRecursive(commentID uint) (int64, error)
}

type commentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) CommentRepository {
	return &commentRepository{db}
}

func (r *commentRepository) WithTx(tx *gorm.DB) CommentRepository {
	// Mengembalikan instance repository baru dengan handle database transaksi (tx)
	return &commentRepository{db: tx}
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

func (r *commentRepository) IsLiked(userID, commentID uint) (bool, error) {
    var count int64
    err := r.db.Model(&models.PostCommentLike{}).
        Where("user_id = ? AND post_comment_id = ?", userID, commentID).
        Count(&count).Error
    return count > 0, err
}

func (r *commentRepository) AddLike(db *gorm.DB, userID, commentID uint) error {
    return db.Create(&models.PostCommentLike{UserID: userID, PostCommentID: commentID}).Error
}

func (r *commentRepository) DeleteLike(db *gorm.DB, userID, commentID uint) error {
    return db.Where("user_id = ? AND post_comment_id = ?", userID, commentID).
        Delete(&models.PostCommentLike{}).Error
}

func (r *commentRepository) CountReplies(commentID uint) (int64, error) {
    var count int64
    err := r.db.Model(&models.PostComment{}).Where("parent_comment_id = ?", commentID).Count(&count).Error
    return count, err
}

func (r *commentRepository) DeleteCommentRecursive(commentID uint, userID uint) error {
    return r.db.Transaction(func(tx *gorm.DB) error {
        var idsToDelete []uint
        query := `
            WITH RECURSIVE reply_tree AS (
                SELECT post_comment_id FROM post_comments WHERE parent_comment_id = ?
                UNION ALL
                SELECT c.post_comment_id FROM post_comments c
                JOIN reply_tree rt ON c.parent_comment_id = rt.post_comment_id
            )
            SELECT post_comment_id FROM reply_tree`
        
        tx.Raw(query, commentID).Scan(&idsToDelete)

        idsToDelete = append(idsToDelete, commentID)

        if err := tx.Where("post_comment_id IN ?", idsToDelete).Delete(&models.PostComment{}).Error; err != nil {
            return err
        }

        return nil
    })
}

func (r *commentRepository) CountAllRepliesRecursive(commentID uint) (int64, error) {
    var count int64

    query := `
        WITH RECURSIVE reply_tree AS (
            SELECT post_comment_id FROM post_comments WHERE parent_comment_id = ?
            UNION ALL
            SELECT c.post_comment_id FROM post_comments c
            JOIN reply_tree rt ON c.parent_comment_id = rt.post_comment_id
        )
        SELECT COUNT(*) FROM reply_tree`
    
    err := r.db.Raw(query, commentID).Scan(&count).Error
    return count, err
}