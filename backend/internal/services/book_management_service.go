package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"backend-bebu/pkg/utils"

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
		// Pastikan kita membuat entitas kosong yang bersih untuk pembuatan buku langsung
		newBook := models.Book{}
		return s.saveBookEntity(tx, &newBook, req)
	})
}

func (s *bookManagementService) EditBook(ctx context.Context, id uint, req dto.UpsertBookRequest) error {
	// Ambil data buku lama dari database sebelum di-update
	oldBook, err := s.repo.GetBookByID(ctx, id)
	if err != nil {
		return errors.New("book not found")
	}

	db := s.repo.GetDB()
	err = db.Transaction(func(tx *gorm.DB) error {
		// Hapus jembatan lama sebelum menulis jembatan relasi baru
		if err := tx.Where("book_id = ?", id).Delete(&models.BookAuthor{}).Error; err != nil { return err }
		if err := tx.Where("book_id = ?", id).Delete(&models.BookGenre{}).Error; err != nil { return err }

		cleanBook := models.Book{
			BookID: id,
		}

		return s.saveBookEntity(tx, &cleanBook, req)
	})

	// Jika transaksi DB gagal, langsung return error dan batalkan hapus Cloudinary
	if err != nil {
		return err
	}

	// PENGHAPUSAN COVER LAMA DI CLOUDINARY	
	if oldBook.CoverImgURL != "" && oldBook.CoverImgURL != req.CoverImgURL {
		_ = utils.DeleteFromCloudinary(oldBook.CoverImgURL)
	}

	return nil
}

func (s *bookManagementService) RemoveBook(ctx context.Context, id uint) error {
	// Cari data buku terlebih dahulu untuk mendapatkan CoverImgURL
	book, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("buku tidak ditemukan")
		}
		return err
	}

	// Hapus gambar cover di Cloudinary jika ada (Menggunakan utilitas reusable)
	if book.CoverImgURL != "" {
		_ = utils.DeleteFromCloudinary(book.CoverImgURL) 
	}

	// 3. Lakukan soft-delete data buku di database
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

func generateShortID() string {
	bytes := make([]byte, 4) // 4 bytes = 8 karakter hex
	if _, err := rand.Read(bytes); err != nil {
		// Fallback aman menggunakan timestamp jika crypto/rand gagal (sangat jarang terjadi)
		return fmt.Sprintf("%x", time.Now().UnixNano())[:8]
	}
	return hex.EncodeToString(bytes)
}

func (s *bookManagementService) saveBookEntity(tx *gorm.DB, b *models.Book, req dto.UpsertBookRequest) error {
	// 🌟 KUNCI STATUS PERUBAHAN DI AWAL SEBELUM PIVOT DAN ENTITAS TER-UPDATE
	isCreateMode := b.BookID == 0

	// Mapping request dasar ke model Book
	b.Title = req.Title
	b.Synopsis = req.Synopsis
	b.CoverImgURL = req.CoverImgURL
	b.GoogleBookID = req.GoogleBookID
	b.PublicationYear = req.PublicationYear
	b.Language = req.Language
	b.TotalPages = req.TotalPages

	if isCreateMode {
		// 🌟 GENERATE SLUG UNIK (Hanya saat pembuatan buku baru)
		shortID := generateShortID()
		titleSlug := slug.Make(b.Title)
		
		// Antisipasi jika judul hanya berisi emoji/simbol sehingga slug-nya kosong
		if titleSlug == "" {
			b.Slug = shortID
		} else {
			b.Slug = fmt.Sprintf("%s-%s", shortID, titleSlug)
		}

		// --- PROSES CREATE ---
		if err := tx.Create(b).Error; err != nil {
			return err
		}

		trimmedGoogleID := strings.TrimSpace(b.GoogleBookID)
		if trimmedGoogleID == "" || trimmedGoogleID == "0" {
			b.GoogleBookID = "" // Kosongkan agar tidak memicu duplikat "0"
			if err := tx.Model(b).Update("google_book_id", gorm.Expr("NULL")).Error; err != nil {
				return err
			}
		}

		// Inisialisasi counter performa statistik buku master
		initStat := models.BookStat{BookID: b.BookID}
		if err := tx.Create(&initStat).Error; err != nil {
			return err
		}
	} else {
		// --- PROSES UPDATE ---
		// 🌟 Omit "slug" di sini memastikan slug lama tidak akan berubah/rusak 
		// meskipun admin mengubah judul buku saat proses update data.
		if err := tx.Model(b).Omit("slug", "BookAuthors", "BookGenres", "Posts", "BookStat", "DailyStats").Updates(b).Error; err != nil {
			return err
		}
		
		trimmedGoogleID := strings.TrimSpace(b.GoogleBookID)
		if trimmedGoogleID == "" || trimmedGoogleID == "0" {
			b.GoogleBookID = "" 
			if err := tx.Model(b).Update("google_book_id", gorm.Expr("NULL")).Error; err != nil {
				return err
			}
		}
	}

	// ==========================================
	// 🌟 PROSES SINKRONISASI AUTHOR (Tetap sama seperti kode Anda)
	// ==========================================
	targetAuthorIDs := make(map[uint]bool)

	for _, authID := range req.AuthorIDs {
		if authID > 0 {
			targetAuthorIDs[authID] = true
		}
	}

	uniqueNewAuthors := make(map[string]bool)
	var cleanedNewAuthorNames []string

	for _, name := range req.NewAuthorNames {
		trimmedName := strings.TrimSpace(name)
		if trimmedName == "" {
			continue
		}
		lowerName := strings.ToLower(trimmedName)
		if !uniqueNewAuthors[lowerName] {
			uniqueNewAuthors[lowerName] = true
			cleanedNewAuthorNames = append(cleanedNewAuthorNames, trimmedName)
		}
	}

	for _, name := range cleanedNewAuthorNames {
		var auth models.Author
		authorSlug := slug.Make(name)

		err := tx.Where("slug = ?", authorSlug).First(&auth).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			auth = models.Author{AuthorName: name, Slug: authorSlug}
			if err := tx.Create(&auth).Error; err != nil {
				return err
			}
		} else if err != nil {
			return err
		}
		targetAuthorIDs[auth.AuthorID] = true
	}

	if !isCreateMode {
		if err := tx.Where("book_id = ?", b.BookID).Delete(&models.BookAuthor{}).Error; err != nil {
			return err
		}
	}

	for authID := range targetAuthorIDs {
		ba := models.BookAuthor{BookID: b.BookID, AuthorID: authID}
		if err := tx.Create(&ba).Error; err != nil {
			return err
		}
	}

	// ==========================================
	// 🌟 PROSES SINKRONISASI GENRE (Tetap sama seperti kode Anda)
	// ==========================================
	targetGenreIDs := make(map[uint]bool)

	for _, genID := range req.GenreIDs {
		if genID > 0 {
			targetGenreIDs[genID] = true
		}
	}

	uniqueNewGenres := make(map[string]bool)
	var cleanedNewGenreNames []string

	for _, name := range req.NewGenreNames {
		trimmedName := strings.TrimSpace(name)
		if trimmedName == "" {
			continue
		}
		lowerName := strings.ToLower(trimmedName)
		if !uniqueNewGenres[lowerName] {
			uniqueNewGenres[lowerName] = true
			cleanedNewGenreNames = append(cleanedNewGenreNames, trimmedName)
		}
	}

	for _, name := range cleanedNewGenreNames {
		var gen models.Genre
		genreSlug := slug.Make(name)

		err := tx.Where("slug = ?", genreSlug).First(&gen).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			gen = models.Genre{GenreName: name, Slug: genreSlug}
			if err := tx.Create(&gen).Error; err != nil {
				return err
			}
		} else if err != nil {
			return err
		}
		targetGenreIDs[gen.GenreID] = true
	}

	if !isCreateMode {
		if err := tx.Where("book_id = ?", b.BookID).Delete(&models.BookGenre{}).Error; err != nil {
			return err
		}
	}

	for genID := range targetGenreIDs {
		bg := models.BookGenre{BookID: b.BookID, GenreID: genID}
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