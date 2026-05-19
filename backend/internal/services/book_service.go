package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/repositories"
)

type BookService interface {
	GetBooks() ([]dto.BookResponse, error)
	GetDynamicFilters(genre string, author string, language string,) (*dto.BookFilterResponse, error)
	SearchBooks(query string, genre string, author string, language string, page int, limit int,) (*dto.BookSearchResponse, error) 
	GetPopularBooks(timeRange string,) (*dto.PopularBooksResponse, error)
	GetHighlyRatedBooks() (*dto.HighlyRatedBooksResponse, error,)
	GetAllBooks(page int, limit int, sort string,) (*dto.AllBooksResponse, error)
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