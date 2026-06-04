package services

import (
	"context"
	"errors"
	"strings"
	"time"

	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"

	"github.com/gosimple/slug"
	"gorm.io/gorm"
)

type BookManagementService interface {
	FetchBooks(ctx context.Context, params dto.BookQueryParams) (dto.PaginatedBookResponse, error)
	AddDirectBook(ctx context.Context, req dto.UpsertBookRequest) error
	EditBook(ctx context.Context, id uint, req dto.UpsertBookRequest) error
	RemoveBook(ctx context.Context, id uint) error

	FetchSubmissions(ctx context.Context, params dto.SubmissionQueryParams) (dto.PaginatedSubmissionResponse, error)
	ApproveAndPublishBook(ctx context.Context, submissionID uint, adminID uint, req dto.UpsertBookRequest) error
	RejectSubmission(ctx context.Context, submissionID uint, adminID uint, req dto.RejectSubmissionRequest) error

	SearchAuthors(ctx context.Context, query string) ([]dto.AuthorSearchResponse, error)
	SearchGenres(ctx context.Context, query string) ([]dto.GenreSearchResponse, error)
}

type bookManagementService struct {
	repo repositories.BookManagementRepository
}

func NewBookManagementService(repo repositories.BookManagementRepository) BookManagementService {
	return &bookManagementService{repo: repo}
}

func (s *bookManagementService) FetchBooks(ctx context.Context, params dto.BookQueryParams) (dto.PaginatedBookResponse, error) {
	return s.repo.GetPaginatedBooks(ctx, params)
}

func (s *bookManagementService) AddDirectBook(ctx context.Context, req dto.UpsertBookRequest) error {
	db := s.repo.GetDB()
	return db.Transaction(func(tx *gorm.DB) error {
		return s.saveBookEntity(tx, &models.Book{}, req)
	})
}

func (s *bookManagementService) EditBook(ctx context.Context, id uint, req dto.UpsertBookRequest) error {
	_, err := s.repo.GetBookByID(ctx, id)
	if err != nil {
		return errors.New("book not found")
	}

	db := s.repo.GetDB()
	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("book_id = ?", id).Delete(&models.BookAuthor{}).Error; err != nil { 
			return err 
		}
		if err := tx.Where("book_id = ?", id).Delete(&models.BookGenre{}).Error; err != nil { 
			return err 
		}

		cleanBook := models.Book{
			BookID: id, // Berikan ID agar GORM tahu ini proses UPDATE, bukan CREATE
		}

		// Oper cleanBook (bukan &b hasil preload)
		return s.saveBookEntity(tx, &cleanBook, req)
	})
}

func (s *bookManagementService) RemoveBook(ctx context.Context, id uint) error {
	return s.repo.DeleteBook(ctx, id)
}

func (s *bookManagementService) FetchSubmissions(ctx context.Context, params dto.SubmissionQueryParams) (dto.PaginatedSubmissionResponse, error) {
	return s.repo.GetPaginatedSubmissions(ctx, params)
}

func (s *bookManagementService) ApproveAndPublishBook(ctx context.Context, submissionID uint, adminID uint, req dto.UpsertBookRequest) error {
	sub, err := s.repo.GetSubmissionByID(ctx, submissionID)
	if err != nil { return errors.New("submission entry not found") }
	if sub.Status != models.BookSubmissionPending { return errors.New("submission has already been processed") }

	db := s.repo.GetDB()
	return db.Transaction(func(tx *gorm.DB) error {
		newBook := models.Book{}
		if err := s.saveBookEntity(tx, &newBook, req); err != nil { return err }

		// Update Status Pengajuan User
		now := time.Now()
		sub.Status = models.BookSubmissionApproved
		sub.ReviewedByUserID = &adminID
		sub.ReviewedAt = &now
		sub.BookID = &newBook.BookID // Hubungkan ID Buku Katalog Baru ke log submission

		return s.repo.UpdateSubmissionTx(tx, &sub)
	})
}

func (s *bookManagementService) RejectSubmission(ctx context.Context, submissionID uint, adminID uint, req dto.RejectSubmissionRequest) error {
	sub, err := s.repo.GetSubmissionByID(ctx, submissionID)
	if err != nil { return errors.New("submission entry not found") }
	if sub.Status != models.BookSubmissionPending { return errors.New("submission has already been processed") }

	db := s.repo.GetDB()
	now := time.Now()
	sub.Status = models.BookSubmissionRejected
	sub.ReviewedByUserID = &adminID
	sub.ReviewedAt = &now
	sub.AdminNote = &req.AdminNote

	return s.repo.UpdateSubmissionTx(db, &sub)
}

func (s *bookManagementService) saveBookEntity(tx *gorm.DB, b *models.Book, req dto.UpsertBookRequest) error {
	// Mapping request ke struct model Book
	b.Title = req.Title
	b.Synopsis = req.Synopsis
	b.CoverImgURL = req.CoverImgURL
	b.GoogleBookID = req.GoogleBookID
	b.PublicationYear = req.PublicationYear
	b.Language = req.Language
	b.TotalPages = req.TotalPages
	b.Slug = slug.Make(b.Title)

	if b.BookID == 0 {
		// --- PROSES CREATE ---
		if err := tx.Create(b).Error; err != nil { 
			return err 
		}

		if strings.TrimSpace(b.GoogleBookID) == "" {
			if err := tx.Model(b).Update("google_book_id", gorm.Expr("NULL")).Error; err != nil {
				return err
			}
		}

		initStat := models.BookStat{BookID: b.BookID}
		if err := tx.Create(&initStat).Error; err != nil { 
			return err 
		}
	} else {
		if err := tx.Model(b).Omit("BookAuthors", "BookGenres", "Posts", "BookStat", "DailyStats").Updates(b).Error; err != nil { 
			return err 
		}

		if strings.TrimSpace(b.GoogleBookID) == "" {
			if err := tx.Model(b).Update("google_book_id", gorm.Expr("NULL")).Error; err != nil {
				return err
			}
		}
	}

	// 4. 🌟 SINKRONISASI DATA AUTHOR (DENGAN PERLINDUNGAN ANTI-DUPLIKAT)
	// Menggunakan map untuk menyaring nama author yang duplikat atau memiliki spasi berlebih
	uniqueAuthors := make(map[string]bool)
	var cleanedAuthorNames []string

	for _, name := range req.AuthorNames {
		trimmedName := strings.TrimSpace(name)
		if trimmedName == "" {
			continue
		}
		
		// Gunakan lowercase hanya sebagai key pembanding keunikan di memori
		lowerName := strings.ToLower(trimmedName)
		if !uniqueAuthors[lowerName] {
			uniqueAuthors[lowerName] = true
			cleanedAuthorNames = append(cleanedAuthorNames, trimmedName) // Simpan nama asli yang bersih
		}
	}

	// Lakukan looping insert menggunakan list nama author yang sudah di-sterilkan
	for _, name := range cleanedAuthorNames {
		var auth models.Author
		authorSlug := slug.Make(name)
		
		// Cari berdasarkan slug author
		err := tx.Where("slug = ?", authorSlug).First(&auth).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			auth = models.Author{AuthorName: name, Slug: authorSlug}
			if err := tx.Create(&auth).Error; err != nil { 
				return err 
			}
		} else if err != nil {
			return err
		}

		ba := models.BookAuthor{BookID: b.BookID, AuthorID: auth.AuthorID}
		if err := tx.Create(&ba).Error; err != nil { 
			return err 
		}
	}

	// 5. SINKRONISASI JEMBATAN GENRE (Menggunakan strategi Find or Create mirip Author)
	for _, name := range req.GenreNames {
		trimmedName := strings.TrimSpace(name)
		if trimmedName == "" {
			continue
		}

		var gen models.Genre
		genreSlug := slug.Make(trimmedName)

		// Cari berdasarkan slug genre agar aman dari perbedaan huruf besar/kecil (Case-Insensitive)
		err := tx.Where("slug = ?", genreSlug).First(&gen).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// JIKA BELUM ADA: Buat genre baru ke tabel master genre
			gen = models.Genre{
				GenreName: trimmedName, 
				Slug:      genreSlug,
			}
			if err := tx.Create(&gen).Error; err != nil { 
				return err 
			}
		} else if err != nil {
			return err
		}

		// Ikat ID Genre tersebut (baik yang baru dibuat maupun yang sudah ada) ke tabel pivot book_genres
		bg := models.BookGenre{BookID: b.BookID, GenreID: gen.GenreID}
		if err := tx.Create(&bg).Error; err != nil { 
			return err 
		}
	}

	return nil
}

func (s *bookManagementService) SearchAuthors(ctx context.Context, query string) ([]dto.AuthorSearchResponse, error) {
	// Jika query kosong, kembalikan array kosong agar menghemat beban query database
	if query == "" {
		return []dto.AuthorSearchResponse{}, nil
	}

	authors, err := s.repo.SearchAuthors(ctx, query)
	if err != nil {
		return nil, err
	}

	// Mapping model GORM ke DTO format JSON yang dibutuhkan Frontend
	var res []dto.AuthorSearchResponse
	for _, a := range authors {
		res = append(res, dto.AuthorSearchResponse{
			ID:   a.AuthorID,
			Name: a.AuthorName,
		})
	}

	// Mengembalikan minimal slice kosong `[]` (bukan nil) agar Frontend tidak crash
	if res == nil {
		return []dto.AuthorSearchResponse{}, nil
	}

	return res, nil
}

func (s *bookManagementService) SearchGenres(ctx context.Context, query string) ([]dto.GenreSearchResponse, error) {
	// Jika query kosong, kembalikan array kosong agar menghemat beban query database
	if query == "" {
		return []dto.GenreSearchResponse{}, nil
	}

	genres, err := s.repo.SearchGenres(ctx, query)
	if err != nil {
		return nil, err
	}

	// Mapping model GORM ke DTO format JSON yang dibutuhkan Frontend
	var res []dto.GenreSearchResponse
	for _, g := range genres {
		res = append(res, dto.GenreSearchResponse{
			ID:   g.GenreID,
			Name: g.GenreName,
			Slug: g.Slug,
		})
	}

	// Mengembalikan minimal slice kosong `[]` (bukan nil) agar Frontend tidak crash
	if res == nil {
		return []dto.GenreSearchResponse{}, nil
	}

	return res, nil
}