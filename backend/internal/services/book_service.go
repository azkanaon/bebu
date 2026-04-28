package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/repositories"
)

type BookService struct {
	repo *repositories.BookRepository
}

func NewBookService(r *repositories.BookRepository) *BookService {
	return &BookService{r}
}

func (s *BookService) GetBooks() ([]dto.BookResponse, error) {
	books, err := s.repo.FindAll()
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