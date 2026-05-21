package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"errors"

	"gorm.io/gorm"
)

type CommentService interface {
	AddComment(userID uint, req dto.CreateCommentRequest) (*models.PostComment, error)
	ToggleLike(userID, commentID uint) (bool, error)
	SoftDeleteComment(commentID uint, userID uint, postID uint) (int, error)
}

type commentService struct {
	repo     repositories.CommentRepository
	postRepo repositories.PostRepository
	db           *gorm.DB    
}

func NewCommentService(repo repositories.CommentRepository, postRepo repositories.PostRepository, db *gorm.DB) CommentService {
	return &commentService{
		repo:     repo,
		postRepo: postRepo,
		db:       db,
	}
}

func (s *commentService) AddComment(userID uint, req dto.CreateCommentRequest) (*models.PostComment, error) {
	var newComment *models.PostComment

	// Gunakan Transaksi agar Komentar & Skor terupdate secara bersamaan
	err := s.db.Transaction(func(tx *gorm.DB) error {
		// Buat instance repo yang terikat transaksi
		txCommentRepo := s.repo.WithTx(tx) // Pastikan CommentRepository punya WithTx
		txPostRepo := s.postRepo.WithTx(tx)

		// 1. Validasi Parent jika ini adalah balasan
		if req.ParentCommentID != nil {
			_, err := txCommentRepo.GetCommentByID(*req.ParentCommentID)
			if err != nil {
				return errors.New("komentar yang ingin dibalas tidak ditemukan")
			}
		}

		newComment = &models.PostComment{
			PostID:          req.PostID,
			UserID:          userID,
			ParentCommentID: req.ParentCommentID,
			Comment:         req.Comment,
		}

		// 2. Simpan komentar ke DB
		if err := tx.Create(newComment).Error; err != nil {
			return err
		}

		// 3. UPDATE SKOR POSTINGAN (Trigger Hot Score)
		// Kita ganti UpdateCommentCount menjadi SyncPostStats
		// field "comment_count" akan ditambah 1, dan Hot Score dihitung ulang otomatis
		if err := txPostRepo.SyncPostStats(tx, req.PostID, "comment_count", 1); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// 4. Ambil data lengkap untuk dikembalikan ke frontend
	return s.repo.GetCommentByID(newComment.PostCommentID)
}

func (s *commentService) ToggleLike(userID, commentID uint) (bool, error) {
	return s.repo.ToggleLikeComment(userID, commentID)
}

func (s *commentService) SoftDeleteComment(commentID uint, userID uint, postID uint) (int, error) {
	var totalToDelete int

	// Gunakan Transaksi agar penghapusan dan update skor sinkron
	err := s.db.Transaction(func(tx *gorm.DB) error {
		txCommentRepo := s.repo.WithTx(tx)
		txPostRepo := s.postRepo.WithTx(tx)

		// 1. Hitung total balasan yang akan ikut terhapus secara rekursif
		totalReplies, err := txCommentRepo.CountAllRepliesRecursive(commentID)
		if err != nil {
			return err
		}
		
		// Total yang dihapus adalah jumlah balasan + komentar itu sendiri (1)
		totalToDelete = int(totalReplies) + 1

		// 2. Lakukan penghapusan komentar secara rekursif di DB
		if err := txCommentRepo.DeleteCommentRecursive(commentID, userID); err != nil {
			return err
		}

		// 3. SYNC SKOR POSTINGAN (Trigger Hot Score)
		// Kita gunakan SyncPostStats dengan nilai NEGATIF (-totalToDelete)
		// Ini akan mengurangi comment_count DAN menghitung ulang hot_score seketika
		if err := txPostRepo.SyncPostStats(tx, postID, "comment_count", -totalToDelete); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return 0, err
	}

	return totalToDelete, nil
}