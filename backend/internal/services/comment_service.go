package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"errors"
	"fmt"
)

type CommentService interface {
	AddComment(userID uint, req dto.CreateCommentRequest) (*models.PostComment, error)
	ToggleLike(userID, commentID uint) (bool, error)
	SoftDeleteComment(commentID uint, userID uint, postID uint) (int, error)
}

type commentService struct {
	repo     repositories.CommentRepository
	postRepo repositories.PostRepository
}

func NewCommentService(repo repositories.CommentRepository, postRepo repositories.PostRepository) CommentService {
	return &commentService{repo, postRepo}
}

func (s *commentService) AddComment(userID uint, req dto.CreateCommentRequest) (*models.PostComment, error) {
	// 1. Validasi Parent jika ini adalah balasan
	if req.ParentCommentID != nil {
		_, err := s.repo.GetCommentByID(*req.ParentCommentID)
		if err != nil {
			return nil, errors.New("komentar yang ingin dibalas tidak ditemukan")
		}
	}

	newComment := &models.PostComment{
		PostID:          req.PostID,
		UserID:          userID,
		ParentCommentID: req.ParentCommentID,
		Comment:         req.Comment,
	}

	// 2. Simpan komentar
	if err := s.repo.CreateComment(newComment); err != nil {
		return nil, err
	}

	// 3. Update statistik secara atomik (Gunakan fungsi yang sudah kamu buat)
	if err := s.repo.UpdateCommentCount(req.PostID, 1); err != nil {
		// Log error statistik tapi tetap return komentar jika sudah berhasil tersimpan
		fmt.Println("Gagal update stats:", err)
	}

	// 4. Ambil data lengkap untuk dikembalikan ke frontend
	return s.repo.GetCommentByID(newComment.PostCommentID)
}

func (s *commentService) ToggleLike(userID, commentID uint) (bool, error) {
	return s.repo.ToggleLikeComment(userID, commentID)
}

func (s *commentService) SoftDeleteComment(commentID uint, userID uint, postID uint) (int, error) {
    totalReplies, err := s.repo.CountAllRepliesRecursive(commentID)
    if err != nil {
        return 0, err
    }
    
    totalToDelete := int(totalReplies) + 1

    err = s.repo.DeleteCommentRecursive(commentID, userID)
    if err != nil {
        return 0, err
    }

    err = s.postRepo.DecrementCommentCountByAmount(postID, totalToDelete)
    if err != nil {
        return 0, err
    }

    return totalToDelete, nil // Kembalikan angka ini
}