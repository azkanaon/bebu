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
	notifService NotificationService
	db           *gorm.DB    
}

func NewCommentService(repo repositories.CommentRepository, postRepo repositories.PostRepository, notifService NotificationService, db *gorm.DB) CommentService {
	return &commentService{
		repo:     repo,
		postRepo: postRepo,
		notifService: notifService,
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

	if err == nil {
		go func() {
			// A. Cari tahu siapa pemilik postingan (Receiver)
			post, errFind := s.postRepo.FindPostByID(req.PostID)
			if errFind == nil && post != nil {
				// B. Kirim Notifikasi
				s.notifService.Send(post.UserID, userID, "POST_COMMENT", "posts", req.PostID)
			}
		}()
	}

	if err == nil {
		go func() {
			// A. Notifikasi untuk PEMILIK POSTINGAN (Sudah ada sebelumnya)
			post, errFind := s.postRepo.FindPostByID(req.PostID)
			if errFind == nil && post != nil {
				s.notifService.Send(post.UserID, userID, "POST_COMMENT", "posts", req.PostID)
			}

			// B. LOGIKA BARU: Notifikasi untuk PEMILIK KOMENTAR INDUK (Jika ini balasan)
			if req.ParentCommentID != nil {
				// Cari komentar induk untuk tahu siapa yang harus dikirim notif (Receiver)
				parentComment, errPC := s.repo.GetCommentByID(*req.ParentCommentID)
				if errPC == nil && parentComment != nil {
					// Kirim Notif Balasan ke pemilik komentar induk
					// Kita tidak mengirim ke diri sendiri (dicek di dalam s.notifService.Send)
					s.notifService.Send(parentComment.UserID, userID, "COMMENT_REPLY", "post_comments", *req.ParentCommentID)
				}
			}
		}()
	}

	if err != nil {
		return nil, err
	}

	// 4. Ambil data lengkap untuk dikembalikan ke frontend
	return s.repo.GetCommentByID(newComment.PostCommentID)
}

func (s *commentService) ToggleLike(userID, commentID uint) (bool, error) {
	var isNowLiked bool

	// 1. Jalankan Transaksi
	err := s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.repo.WithTx(tx)

		// A. Cek status saat ini
		alreadyLiked, err := txRepo.IsLiked(userID, commentID)
		if err != nil { return err }

		if alreadyLiked {
			// B. UNLIKE: Hapus baris & Kurangi counter
			if err := txRepo.DeleteLike(tx, userID, commentID); err != nil { return err }
			if err := tx.Model(&models.PostComment{}).Where("post_comment_id = ?", commentID).
				UpdateColumn("like_count", gorm.Expr("like_count - ?", 1)).Error; err != nil {
				return err
			}
			isNowLiked = false
		} else {
			// C. LIKE: Tambah baris & Tambah counter
			if err := txRepo.AddLike(tx, userID, commentID); err != nil { return err }
			if err := tx.Model(&models.PostComment{}).Where("post_comment_id = ?", commentID).
				UpdateColumn("like_count", gorm.Expr("like_count + ?", 1)).Error; err != nil {
				return err
			}
			isNowLiked = true
		}
		return nil
	})

	// --- 2. LOGIKA NOTIFIKASI (Di luar transaksi) ---
	if err == nil {
		go func() {
			// Cari tahu siapa pemilik komentar (Receiver)
			comment, errFind := s.repo.GetCommentByID(commentID)
			if errFind == nil && comment != nil {
				if isNowLiked {
					// Kirim Notifikasi
					s.notifService.Send(comment.UserID, userID, "COMMENT_LIKE", "post_comments", commentID)
				} else {
					// Hapus/Kurangi Notifikasi
					s.notifService.Remove(comment.UserID, userID, "COMMENT_LIKE", "post_comments", commentID, 1)
				}
			}
		}()
	}

	return isNowLiked, err
}

func (s *commentService) SoftDeleteComment(commentID uint, userID uint, postID uint) (int, error) {	
	comment, err := s.repo.GetCommentByID(commentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, errors.New("komentar tidak ditemukan")
		}
		return 0, err
	}
	var totalToDelete int


	// Gunakan Transaksi agar penghapusan dan update skor sinkron
	err = s.db.Transaction(func(tx *gorm.DB) error {
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

	if err == nil {
		go func() {
			// A. Notifikasi untuk PEMILIK POSTINGAN
			post, errFind := s.postRepo.FindPostByID(postID)
			if errFind == nil && post != nil {
				s.notifService.Remove(post.UserID, userID, "POST_COMMENT", "posts", postID, totalToDelete)
			}

			// B. Notifikasi untuk PEMILIK KOMENTAR INDUK (Jika yang dihapus adalah balasan)
			if comment.ParentCommentID != nil {
				// Cari tahu siapa pemilik komentar induknya
				parentComment, errPC := s.repo.GetCommentByID(*comment.ParentCommentID)
				if errPC == nil && parentComment != nil {
					// Hapus/Kurangi notifikasi COMMENT_REPLY di daftar si pemilik parent
					s.notifService.Remove(parentComment.UserID, userID, "COMMENT_REPLY", "post_comments", *comment.ParentCommentID, 1)
				}
			}
		}()
	}

	if err != nil {
		return 0, err
	}

	return totalToDelete, nil
}