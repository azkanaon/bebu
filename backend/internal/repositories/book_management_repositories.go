package repositories

import (
	"context"
	"fmt"
	"math"
	"strings"
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"

	"github.com/gosimple/slug"
	"gorm.io/gorm"

)

type BookManagementRepository interface {
	GetDB() *gorm.DB // Diperlukan untuk koordinasi transaksi di layer service
	// Master Books
	GetPaginatedBooks(ctx context.Context, params dto.BookQueryParams) (dto.PaginatedBookResponse, error)
	CreateBookTx(tx *gorm.DB, book *models.Book) error
	GetBookByID(ctx context.Context, id uint) (models.Book, error)
	UpdateBookTx(tx *gorm.DB, book *models.Book) error
	DeleteBook(ctx context.Context, id uint) error
	// Submissions
	GetPaginatedSubmissions(ctx context.Context, params dto.SubmissionQueryParams) (dto.PaginatedSubmissionResponse, error)
	GetSubmissionByID(ctx context.Context, id uint) (models.BookSubmission, error)
	UpdateSubmissionTx(tx *gorm.DB, sub *models.BookSubmission) error

	SearchAuthors(ctx context.Context, query string) ([]models.Author, error)
	SearchGenres(ctx context.Context, query string) ([]models.Genre, error)
}

type bookManagementRepository struct {
	db *gorm.DB
}

func NewBookManagementRepository(db *gorm.DB) BookManagementRepository {
	return &bookManagementRepository{db: db}
}

func (r *bookManagementRepository) GetDB() *gorm.DB { return r.db }

func (r *bookManagementRepository) GetPaginatedBooks(ctx context.Context, params dto.BookQueryParams) (dto.PaginatedBookResponse, error) {
	var resp dto.PaginatedBookResponse
	var books []models.Book
	var totalRows int64

	if params.Page <= 0 { params.Page = 1 }
	if params.Limit <= 0 { params.Limit = 10 }
	offset := (params.Page - 1) * params.Limit

	// 1. Inisialisasi kueri dasar
	query := r.db.WithContext(ctx).Model(&models.Book{})

	// 2. Terapkan filter pencarian secara kondisional ke instance query utama
	if params.Search != "" {
		searchPattern := fmt.Sprintf("%%%s%%", strings.ToLower(params.Search))
		query = query.Joins("LEFT JOIN book_authors ON book_authors.book_id = books.book_id").
			Joins("LEFT JOIN authors ON authors.author_id = book_authors.author_id").
			Where("LOWER(books.title) LIKE ? OR LOWER(authors.author_name) LIKE ?", searchPattern, searchPattern).
			Group("books.book_id")
	}

	// 3. Hitung jumlah total baris langsung dari instance kueri yang sudah ter-filter (Tanpa .Merge)
	// Kita gunakan subquery dari query utama agar klausa GroupBy tidak merusak hasil fungsi Count()
	if err := r.db.WithContext(ctx).Table("(?) as grouped_books", query).Count(&totalRows).Error; err != nil {
		return resp, err
	}

	// 4. Tambahkan Preload, Offset, Limit, dan Order untuk penarikan data halaman terkait
	if err := query.Preload("BookAuthors.Author").
		Preload("BookGenres.Genre").
		Offset(offset).
		Limit(params.Limit).
		Order("books.created_at DESC").
		Find(&books).Error; err != nil {
		return resp, err
	}

	listData := make([]dto.ManageBookResponse, 0)
	for _, b := range books {
		authors := []string{}
		for _, ba := range b.BookAuthors {
			authors = append(authors, ba.Author.AuthorName)
		}
		genres := []string{}
		for _, bg := range b.BookGenres {
			genres = append(genres, bg.Genre.GenreName)
		}

		listData = append(listData, dto.ManageBookResponse{
			BookID:          b.BookID,
			PublicID:        b.PublicID.String(),
			Title:           b.Title,
			Synopsis:        b.Synopsis,
			CoverImgURL:     b.CoverImgURL,
			GoogleBookID:    b.GoogleBookID,
			PublicationYear: b.PublicationYear,
			Language:        b.Language,
			TotalPages:      b.TotalPages,
			Slug:            b.Slug,
			Authors:         authors,
			Genres:          genres,
			CreatedAt:       b.CreatedAt,
		})
	}

	resp.Data = listData
	resp.TotalRows = totalRows
	resp.Page = params.Page
	resp.Limit = params.Limit
	resp.TotalPages = int(math.Ceil(float64(totalRows) / float64(params.Limit)))
	return resp, nil
}

func (r *bookManagementRepository) CreateBookTx(tx *gorm.DB, book *models.Book) error {
	book.Slug = slug.Make(book.Title)
	return tx.Create(book).Error
}

func (r *bookManagementRepository) GetBookByID(ctx context.Context, id uint) (models.Book, error) {
	var b models.Book
	err := r.db.WithContext(ctx).Preload("BookAuthors").Preload("BookGenres").First(&b, id).Error
	return b, err
}

func (r *bookManagementRepository) UpdateBookTx(tx *gorm.DB, book *models.Book) error {
	book.Slug = slug.Make(book.Title)
	return tx.Save(book).Error
}

func (r *bookManagementRepository) DeleteBook(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.Book{}, id).Error
}

func (r *bookManagementRepository) GetPaginatedSubmissions(ctx context.Context, params dto.SubmissionQueryParams) (dto.PaginatedSubmissionResponse, error) {
	var resp dto.PaginatedSubmissionResponse
	var subs []models.BookSubmission
	var totalRows int64

	if params.Page <= 0 { params.Page = 1 }
	if params.Limit <= 0 { params.Limit = 10 }
	offset := (params.Page - 1) * params.Limit

	// Gunakan nested preload "SubmittedByUser.Profile" agar data DisplayName bisa diakses
	query := r.db.WithContext(ctx).Model(&models.BookSubmission{}).
		Preload("SubmittedByUser.Profile").
		Preload("Authors")

	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}

	if params.Search != "" {
		searchPattern := fmt.Sprintf("%%%s%%", params.Search)
		query = query.Where("(title ILIKE ? OR isbn ILIKE ?)", searchPattern, searchPattern)
	}

	if err := query.Count(&totalRows).Error; err != nil {
		return resp, err
	}

	if err := query.Offset(offset).Limit(params.Limit).Order("created_at DESC").Find(&subs).Error; err != nil {
		return resp, err
	}

	listData := make([]dto.ManageSubmissionResponse, 0)
	for _, s := range subs {
		authors := []string{}
		for _, a := range s.Authors {
			authors = append(authors, a.AuthorName)
		}

		// Ambil DisplayName secara aman dari relasi Profile (antisipasi jika profile data bernilai nil)
		displayName := s.SubmittedByUser.Username // Fallback awal ke username
		if s.SubmittedByUser.Profile != nil && s.SubmittedByUser.Profile.DisplayName != "" {
			displayName = s.SubmittedByUser.Profile.DisplayName
		}

		subBy := fmt.Sprintf("%s (@%s)", displayName, s.SubmittedByUser.Username)
		
		listData = append(listData, dto.ManageSubmissionResponse{
			BookSubmissionID: s.BookSubmissionID,
			SubmittedByByInfo: subBy,
			Title:            s.Title,
			TotalPages:       s.TotalPages,
			Language:         s.Language,
			ISBN:             s.ISBN,
			Synopsis:         s.Synopsis,
			CoverImgURL:      s.CoverImgURL,
			UserNote:         s.UserNote,
			AdminNote:        s.AdminNote,
			Status:           string(s.Status),
			Authors:          authors,
			CreatedAt:        s.CreatedAt,
		})
	}

	resp.Data = listData
	resp.TotalRows = totalRows
	resp.Page = params.Page
	resp.Limit = params.Limit
	resp.TotalPages = int(math.Ceil(float64(totalRows) / float64(params.Limit)))
	return resp, nil
}

func (r *bookManagementRepository) GetSubmissionByID(ctx context.Context, id uint) (models.BookSubmission, error) {
	var s models.BookSubmission
	err := r.db.WithContext(ctx).Preload("Authors").First(&s, id).Error
	return s, err
}

func (r *bookManagementRepository) UpdateSubmissionTx(tx *gorm.DB, sub *models.BookSubmission) error {
	return tx.Save(sub).Error
}

// Get Data Author Box
func (r *bookManagementRepository) SearchAuthors(ctx context.Context, query string) ([]models.Author, error) {
	var authors []models.Author

	err := r.db.WithContext(ctx).
		Where("author_name ILIKE ?", "%"+query+"%"). 
		Limit(10).
		Find(&authors).Error
		
	return authors, err
}

func (r *bookManagementRepository) SearchGenres(ctx context.Context, query string) ([]models.Genre, error) {
	var genres []models.Genre

	// Menggunakan ILIKE untuk PostgreSQL (atau ganti ke LIKE jika menggunakan MySQL/SQLite)
	err := r.db.WithContext(ctx).
		Where("genre_name ILIKE ?", "%"+query+"%"). 
		Limit(10).
		Find(&genres).Error
		
	return genres, err
}