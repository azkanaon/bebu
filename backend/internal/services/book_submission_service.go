package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"backend-bebu/pkg/utils"
	"errors"
	"mime/multipart"

	"gorm.io/gorm"
)

type BookSubmissionService interface {
	CreateSubmission(userID uint, req dto.CreateBookSubmissionRequest, coverFile *multipart.FileHeader) error
	GetMySubmissions(userID uint, status string, page, limit int) ([]dto.MySubmissionResponse, *dto.PaginationDTO, error)
	UpdateSubmission(userID uint, subID uint, req dto.CreateBookSubmissionRequest, file *multipart.FileHeader) error
	DeleteSubmission(userID uint, subID uint) error
}

type bookSubmissionService struct {
	repo repositories.BookSubmissionRepository
	db       *gorm.DB
}

func NewBookSubmissionService(repo repositories.BookSubmissionRepository, db *gorm.DB) BookSubmissionService {
	return &bookSubmissionService{
		repo: repo,
		db:   db, // <-- MASUKKAN KE STRUCT
	}
}

func (s *bookSubmissionService) CreateSubmission(userID uint, req dto.CreateBookSubmissionRequest, coverFile *multipart.FileHeader) error {
	// 1. Handle Upload Cover jika ada
	var coverURL string
	if coverFile != nil {
		url, err := utils.UploadToCloudinary(coverFile, "bebu/submissions")
		if err != nil {
			return err
		}
		coverURL = url
	}

	// 2. Transformasi DTO ke Model
	submission := &models.BookSubmission{
		SubmittedByUserID: userID,
		Title:             req.Title,
		Status:            "pending",
	}

	// Hanya isi jika tidak kosong, jika kosong otomatis jadi NULL di DB
	if req.Synopsis != "" { submission.Synopsis = &req.Synopsis }
	if req.Language != "" { submission.Language = &req.Language }
	if req.ISBN != ""     { submission.ISBN = &req.ISBN }
	if req.UserNote != "" { submission.UserNote = &req.UserNote }
	if req.PublicationYear > 0 {
        year := int16(req.PublicationYear)
        submission.PublicationYear = &year
    }
	if req.TotalPages > 0 {
		val := req.TotalPages
		submission.TotalPages = &val
	}

	if coverURL != "" {
		submission.CoverImgURL = &coverURL
	}

	for _, a := range req.Authors {
		authorEntry := models.BookSubmissionAuthor{}
		if a.ID > 0 {
			authorEntry.AuthorID = &a.ID // Gunakan ID yang sudah ada
		} else {
			nameCopy := a.Name
			authorEntry.AuthorName = &nameCopy // Usul nama baru
		}
		submission.SubmissionAuthors = append(submission.SubmissionAuthors, authorEntry)
	}

	// 2. Proses Genres
	for _, g := range req.Genres {
		genreEntry := models.BookSubmissionGenre{}
		if g.ID > 0 {
			genreEntry.GenreID = &g.ID
		} else {
			nameCopy := g.Name
			genreEntry.GenreName = &nameCopy
		}
		submission.SubmissionGenres = append(submission.SubmissionGenres, genreEntry)
	}

	return s.repo.CreateSubmission(submission)
}

func (s *bookSubmissionService) GetMySubmissions(userID uint, status string, page, limit int) ([]dto.MySubmissionResponse, *dto.PaginationDTO, error) {
	// 1. Ambil data dari repository
	submissions, total, err := s.repo.GetSubmissionsByUserID(userID, status, page, limit)
	if err != nil {
		return nil, nil, err
	}

	// 2. Mapping dari Model ke DTO
	var responseDTOs []dto.MySubmissionResponse
	for _, sub := range submissions {
		authors := make([]string, 0)
		for _, a := range sub.SubmissionAuthors {
			if a.AuthorID != nil && a.Author.AuthorID > 0 {
				// Jika ID ada, ambil nama dari tabel master (yang sudah di-preload)
				authors = append(authors, a.Author.AuthorName)
			} else if a.AuthorName != nil {
				// Jika ID kosong, ambil teks usulan user (dereference pointer *)
				authors = append(authors, *a.AuthorName)
			}
		}

		// --- PERBAIKAN LOGIKA GENRES ---
		genres := make([]string, 0)
		for _, g := range sub.SubmissionGenres {
			if g.GenreID != nil && g.Genre.GenreID > 0 {
				genres = append(genres, g.Genre.GenreName)
			} else if g.GenreName != nil {
				genres = append(genres, *g.GenreName)
			}
		}

		responseDTOs = append(responseDTOs, dto.MySubmissionResponse{
			ID:          sub.BookSubmissionID,
			Title:       sub.Title,
			Status:      string(sub.Status),
			CoverImgURL: sub.CoverImgURL,
			Authors:     authors,
			Genres:      genres,
			PublicationYear: sub.PublicationYear,
			UserNote:    sub.UserNote,
			AdminNote:   sub.AdminNote,
			CreatedAt:   sub.CreatedAt,
			UpdatedAt:   sub.UpdatedAt,
		})
	}

	// 3. Buat metadata paginasi
	pagination := dto.NewPaginationDTO(total, page, limit)

	return responseDTOs, pagination, nil
}

func (s *bookSubmissionService) UpdateSubmission(userID uint, subID uint, req dto.CreateBookSubmissionRequest, coverFile *multipart.FileHeader) error {
	sub, err := s.repo.FindSubmissionByID(subID)
	if err != nil {
		return errors.New("submission not found")
	}

	// Cek pemilik pengajuan
	if sub.SubmittedByUserID != userID {
		return errors.New("forbidden: this is not your submission")
	}

	// Cek status pengajuan
	if sub.Status != "pending" && sub.Status != "needs_revision" {
		return errors.New("cannot edit: submission is already processed")
	}

	// Proses Cover baru jika diupload
	if coverFile != nil {
		url, err := utils.UploadToCloudinary(coverFile, "bebu/submissions")
		if err == nil {
			sub.CoverImgURL = &url
		}
	} else if req.RemoveCover != nil && *req.RemoveCover == true {
		sub.CoverImgURL = nil 
	}

	// Transaction
	return s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.repo.WithTx(tx)
		if req.Title != "" { sub.Title = req.Title }
		if req.Synopsis != "" { sub.Synopsis = &req.Synopsis }
		if req.Language != "" { sub.Language = &req.Language }
		if req.ISBN != "" { sub.ISBN = &req.ISBN }
		if req.UserNote != "" { sub.UserNote = &req.UserNote }
		if req.TotalPages > 0 { sub.TotalPages = &req.TotalPages }
		if req.PublicationYear > 0 {
			year := int16(req.PublicationYear)
			sub.PublicationYear = &year
		}
		if err := s.repo.UpdateSubmission(tx, sub); err != nil { return err }

		// Update Relasi Genre
		if len(req.Authors) > 0 {
			if err := txRepo.DeleteSubmissionAuthors(subID); err != nil {
				return err
			}
			
			for _, a := range req.Authors {
				authorEntry := models.BookSubmissionAuthor{BookSubmissionID: subID}
				if a.ID > 0 {
					authorEntry.AuthorID = &a.ID
				} else {
					nameCopy := a.Name
					authorEntry.AuthorName = &nameCopy
				}

				if err := tx.Create(&authorEntry).Error; err != nil {
					return err
				}
			}
		}

		// Update Relasi Genre
		if len(req.Genres) > 0 {
			if err := txRepo.DeleteSubmissionGenres(subID); err != nil {
				return err
			}
			
			for _, g := range req.Genres {
				genreEntry := models.BookSubmissionGenre{BookSubmissionID: subID}
				if g.ID > 0 {
					genreEntry.GenreID = &g.ID
				} else {
					nameCopy := g.Name
					genreEntry.GenreName = &nameCopy
				}
				
				if err := tx.Create(&genreEntry).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}

func (s *bookSubmissionService) DeleteSubmission(userID uint, subID uint) error {
	// 1. Ambil data pengajuan
	sub, err := s.repo.FindSubmissionByID(subID)
	if err != nil {
		return errors.New("submission not found")
	}

	// 2. Cek Kepemilikan
	if sub.SubmittedByUserID != userID {
		return errors.New("forbidden: you can only delete your own submission")
	}

	// 3. Cek Status (Cegah hapus jika sudah di-approve/reject)
	if sub.Status == "approved" || sub.Status == "rejected" {
		return errors.New("cannot delete: submission has already been processed by admin")
	}

	// 4. Eksekusi Hapus
	 return s.db.Transaction(func(tx *gorm.DB) error {
        // Sekarang WithTx sudah ada!
        txRepo := s.repo.WithTx(tx)

        // Semua aksi di bawah ini sekarang berjalan di dalam pipa 'tx' yang sama
        if err := txRepo.DeleteSubmissionAuthors(subID); err != nil { return err }
        if err := txRepo.DeleteSubmissionGenres(subID); err != nil { return err }
        if err := txRepo.DeleteSubmission(subID); err != nil { return err }

        return nil
    })
}