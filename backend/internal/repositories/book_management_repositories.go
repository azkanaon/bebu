package repositories

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"context"
	"fmt"
	"math"
	"strings"

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
		authors := make([]dto.BookAuthorResponse, 0)

		for _, ba := range b.BookAuthors {
			authors = append(authors, dto.BookAuthorResponse{
				ID:   ba.Author.AuthorID,
				Name: ba.Author.AuthorName,
			})
		}

		genres := make([]dto.BookGenreResponse, 0)

		for _, bg := range b.BookGenres {
			genres = append(genres, dto.BookGenreResponse{
				ID:   bg.Genre.GenreID,
				Name: bg.Genre.GenreName,
			})
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

func (r *bookManagementRepository) GetPaginatedSubmissions(
	ctx context.Context,
	params dto.SubmissionQueryParams,
) (dto.PaginatedSubmissionResponse, error) {

	var resp dto.PaginatedSubmissionResponse
	var subs []models.BookSubmission
	var totalRows int64

	if params.Page <= 0 { params.Page = 1 }
	if params.Limit <= 0 { params.Limit = 10 }
	offset := (params.Page - 1) * params.Limit

	// 1. TAMBAHKAN NESTED PRELOAD KE TABEL MASTER UTAMA
	query := r.db.WithContext(ctx).
		Model(&models.BookSubmission{}).
		Preload("SubmittedByUser.Profile").
		Preload("SubmissionAuthors.Author"). // Preload tabel master author
		Preload("SubmissionGenres.Genre")    // Preload tabel master genre

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

	if err := query.
		Order("created_at DESC").
		Offset(offset).
		Limit(params.Limit).
		Find(&subs).Error; err != nil {
		return resp, err
	}

	listData := make([]dto.ManageSubmissionResponse, 0, len(subs))

	for _, s := range subs {
		// 2. MAPPING LOGIKA DATA AUTHORS
		authorsResponse := make([]dto.SubmissionAuthorResponse, 0)
		for _, a := range s.SubmissionAuthors {
			var authID uint
			var authName string

			if a.AuthorID != nil {
				authID = *a.AuthorID
				authName = a.Author.AuthorName // Ambil dari hasil Preload master tabel
			}
			
			// Jika user mengetikkan nama penulis baru di form submission
			if a.AuthorName != nil && *a.AuthorName != "" {
				authName = *a.AuthorName
			}

			if authName != "" {
				authorsResponse = append(authorsResponse, dto.SubmissionAuthorResponse{
					ID:   authID,
					Name: authName,
				})
			}
		}

		// 3. MAPPING LOGIKA DATA GENRES
		genresResponse := make([]dto.SubmissionGenreResponse, 0)
		for _, g := range s.SubmissionGenres {
			var genID uint
			var genName string

			if g.GenreID != nil {
				genID = *g.GenreID
				genName = g.Genre.GenreName // Ambil dari hasil Preload master tabel
			}

			// Jika user mengetikkan nama genre baru di form submission
			if g.GenreName != nil && *g.GenreName != "" {
				genName = *g.GenreName
			}

			if genName != "" {
				genresResponse = append(genresResponse, dto.SubmissionGenreResponse{
					ID:   genID,
					Name: genName,
				})
			}
		}

		displayName := s.SubmittedByUser.Username
		if s.SubmittedByUser.Profile != nil && s.SubmittedByUser.Profile.DisplayName != "" {
			displayName = s.SubmittedByUser.Profile.DisplayName
		}
		subBy := fmt.Sprintf("%s (@%s)", displayName, s.SubmittedByUser.Username)

		totalPages := 0
		if s.TotalPages != nil { totalPages = *s.TotalPages }

		language := ""; if s.Language != nil { language = *s.Language }
		isbn := ""; if s.ISBN != nil { isbn = *s.ISBN }
		synopsis := ""; if s.Synopsis != nil { synopsis = *s.Synopsis }
		coverImgURL := ""; if s.CoverImgURL != nil { coverImgURL = *s.CoverImgURL }
		userNote := ""; if s.UserNote != nil { userNote = *s.UserNote }
		adminNote := ""; if s.AdminNote != nil { adminNote = *s.AdminNote }

		listData = append(listData, dto.ManageSubmissionResponse{
			BookSubmissionID:  s.BookSubmissionID,
			SubmittedByByInfo: subBy,
			Title:             s.Title,
			TotalPages:        totalPages,
			Language:          language,
			ISBN:              isbn,
			Synopsis:          synopsis,
			CoverImgURL:       coverImgURL,
			UserNote:          userNote,
			AdminNote:         adminNote,
			Status:            string(s.Status),
			Authors:           authorsResponse, // Pakai data terstruktur objek
			Genres:            genresResponse,  // Pakai data terstruktur objek
			CreatedAt:         s.CreatedAt,
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
	
	err := r.db.WithContext(ctx).First(&s, id).Error
	
	return s, err
}

func (r *bookManagementRepository) UpdateSubmissionTx(tx *gorm.DB, sub *models.BookSubmission) error {
	// 💡 PERBAIKAN: Ganti gorm.Associations menjadi string literal "Associations"
	return tx.Model(sub).Omit("Associations").Save(sub).Error
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