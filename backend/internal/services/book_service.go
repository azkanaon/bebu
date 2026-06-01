package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/repositories"
	"backend-bebu/internal/models"
	"backend-bebu/internal/mapper"

	"context"
	"errors"
)

type BookService interface {
	GetBooks() ([]dto.BookResponse, error)
	GetDynamicFilters(genre string, author string, language string,) (*dto.BookFilterResponse, error)
	SearchBooks(query string, genre string, author string, language string, page int, limit int,) (*dto.BookSearchResponse, error) 
	GetPopularBooks(timeRange string,) (*dto.PopularBooksResponse, error)
	GetHighlyRatedBooks() (*dto.HighlyRatedBooksResponse, error,)
	GetAllBooks(page int, limit int, sort string,) (*dto.AllBooksResponse, error)
	GetBookProfile(ctx context.Context, slug string) (*dto.BookProfileResponse, error)
	GetBookRecommendations(ctx context.Context, slug string) (*dto.BookRecommendationsResponse, error)
	GetBookPosts(ctx context.Context, slug string, postType string, cursor uint, limit int, userID uint) ([]interface{}, error)
}

type bookService struct {
	bookRepo repositories.BookRepository
}

func NewBookService(r repositories.BookRepository) BookService {
	return &bookService{r}
}

func (s *bookService) GetBooks() ([]dto.BookResponse, error) {
	books, err := s.bookRepo.FindAll()
	if err != nil {
		return nil, err
	}

	var res []dto.BookResponse

	for _, b := range books {
		res = append(res, dto.BookResponse{
			BookID: b.BookID,
			Title:    b.Title,
		})
	}

	return res, nil
}

func (s *bookService) GetDynamicFilters(
	genre string,
	author string,
	language string,
) (*dto.BookFilterResponse, error) {
	return s.bookRepo.GetDynamicFilters(
		genre,
		author,
		language,
	)
}

func (s *bookService) SearchBooks(
	query string,
	genre string,
	author string,
	language string,
	page int,
	limit int,
) (*dto.BookSearchResponse, error) {
	return s.bookRepo.SearchBooks(
		query,
		genre,
		author,
		language,
		page,
		limit,
	)
}

func (s *bookService) GetPopularBooks(timeRange string,) (*dto.PopularBooksResponse, error) {

	validRanges := map[string]bool{
		"today": true,
		"7d":    true,
		"30d":   true,
		"all":   true,
	}

	if !validRanges[timeRange] {
		timeRange = "all"
	}

	books, err := s.bookRepo.GetPopularBooks(
		timeRange,
		10,
	)

	if err != nil {
		return nil, err
	}

	return &dto.PopularBooksResponse{
		Range: timeRange,
		Books: books,
	}, nil
}

func (s *bookService) GetHighlyRatedBooks() (*dto.HighlyRatedBooksResponse, error,) {
	books, err :=
		s.bookRepo.
			GetHighlyRatedBooks(10)

	if err != nil {
		return nil, err
	}

	return &dto.HighlyRatedBooksResponse{
		Books: books,
	}, nil
}

func (s *bookService) GetAllBooks(page int, limit int, sort string,) (*dto.AllBooksResponse, error) {
	if page <= 0 {
		page = 1
	}

	if limit <= 0 {
		limit = 20
	}

	return s.bookRepo.GetAllBooks(
		page,
		limit,
		sort,
	)
}

/* --- BOOK PROFILE --- */

func (s *bookService) GetBookProfile(ctx context.Context, slug string) (*dto.BookProfileResponse, error) {
	if slug == "" {
		return nil, errors.New("slug parameter is required")
	}

	book, err := s.bookRepo.GetBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	if book == nil {
		return nil, errors.New("book not found")
	}

	// === PROSES MAPPING KE DTO ===
	
	// 1. Map Authors
	var authorsDTO []dto.AuthorDTO
	for _, ba := range book.BookAuthors {
		authorsDTO = append(authorsDTO, dto.AuthorDTO{
			PublicID:   ba.Author.PublicID.String(),
			AuthorName: ba.Author.AuthorName,
			Slug:       ba.Author.Slug,
		})
	}

	// 2. Map Genres
	var genresDTO []dto.GenreDTO
	for _, bg := range book.BookGenres {
		genresDTO = append(genresDTO, dto.GenreDTO{
			GenreName: bg.Genre.GenreName,
			Slug:       bg.Genre.Slug,
		})
	}

	// 3. Map Stats
	statsDTO := dto.BookStatDTO{
		OverallRating:  book.BookStat.OverallRating,
		TotalRatingSum: book.BookStat.TotalRatingSum,
		TotalReviews:   book.BookStat.TotalReviews,
		TotalPosts:     book.BookStat.TotalPosts,
		Rating1Count:   book.BookStat.Rating1Count,
		Rating2Count:   book.BookStat.Rating2Count,
		Rating3Count:   book.BookStat.Rating3Count,
		Rating4Count:   book.BookStat.Rating4Count,
		Rating5Count:   book.BookStat.Rating5Count,
	}

	// 4. Gabungkan ke Response Utama
	response := &dto.BookProfileResponse{
		BookID:        	 book.BookID,
		PublicID:        book.PublicID.String(),
		Title:           book.Title,
		Synopsis:        book.Synopsis,
		CoverImgURL:     book.CoverImgURL,
		PublicationYear: book.PublicationYear,
		Language:        book.Language,
		TotalPages:      book.TotalPages,
		Slug:            book.Slug,
		GoogleBookID:    book.GoogleBookID,
		Authors:         authorsDTO,
		Genres:          genresDTO,
		Stats:           statsDTO,
	}

	return response, nil
}

func (s *bookService) GetBookRecommendations(ctx context.Context, slug string) (*dto.BookRecommendationsResponse, error) {
	currentBook, err := s.bookRepo.GetBySlug(ctx, slug)
	if err != nil || currentBook == nil {
		return nil, err
	}

	var genreIDs []uint
	for _, bg := range currentBook.BookGenres {
		genreIDs = append(genreIDs, bg.GenreID)
	}

	var authorIDs []uint
	for _, ba := range currentBook.BookAuthors {
		authorIDs = append(authorIDs, ba.AuthorID)
	}

	rawGenreBooks, err := s.bookRepo.GetRecommendationsByGenres(ctx, currentBook.BookID, genreIDs, 10)
	if err != nil {
		return nil, err
	}

	rawAuthorBooks, err := s.bookRepo.GetRecommendationsByAuthors(ctx, currentBook.BookID, authorIDs, 10)
	if err != nil {
		return nil, err
	}

	// Helper function untuk mapping ke DTO yang telah disesuaikan
	mapToDTO := func(books []models.Book) []dto.RecommendationBookItem {
		var list []dto.RecommendationBookItem
		for _, b := range books {
			firstAuthor := "Unknown Author"
			if len(b.BookAuthors) > 0 && b.BookAuthors[0].Author.AuthorName != "" {
				firstAuthor = b.BookAuthors[0].Author.AuthorName
			}

			// Ambil nilai rating dari preloaded BookStat secara aman
			var rating float32 = 0.0
			if b.BookStat.BookID != 0 {
				rating = b.BookStat.OverallRating
			}

			list = append(list, dto.RecommendationBookItem{
				PublicID:        b.PublicID.String(),
				Title:           b.Title,
				CoverImgURL:     b.CoverImgURL,
				FirstAuthor:     firstAuthor,
				TotalPages:      b.TotalPages,
				PublicationYear: b.PublicationYear,
				Slug:            b.Slug,
				Rating:          rating, // ISI DATA RATING DI SINI
			})
		}
		return list
	}

	return &dto.BookRecommendationsResponse{
		GenreRecommendations:  mapToDTO(rawGenreBooks),
		AuthorRecommendations: mapToDTO(rawAuthorBooks),
	}, nil
}

func (s *bookService) GetBookPosts(ctx context.Context, slug string, postType string, cursor uint, limit int, userID uint) ([]interface{}, error) {
	// 1. Cari buku terlebih dahulu untuk mendapatkan BookID asli
	book, err := s.bookRepo.GetBySlug(ctx, slug)
	if err != nil || book == nil {
		return nil, err
	}

	// 2. Ambil data postingan terfilter dari repository
	posts, err := s.bookRepo.GetBookPosts(ctx, book.BookID, postType, cursor, limit, userID)
	if err != nil {
		return nil, err
	}

	// 3. Mapping data menggunakan mapper yang bersih dari list komentar
	var result []interface{}
	for _, p := range posts {
		if p.PostType == "review" {
			// Buat fungsi ToBookReviewPostResponse di package mapper kamu (tanpa comment_list)
			result = append(result, mapper.ToBookReviewPostResponse(p, userID))
		} else if p.PostType == "analysis" {
			// Buat fungsi ToBookAnalysisPostResponse di package mapper kamu (tanpa comment_list)
			result = append(result, mapper.ToBookAnalysisPostResponse(p, userID))
		}
	}

	return result, nil
}