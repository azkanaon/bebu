package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/repositories"
)

type CategoryService struct {
	repo *repositories.CategoryRepository // ✅ HARUS INI
}

func NewCategoryService(r *repositories.CategoryRepository) *CategoryService {
	return &CategoryService{repo: r}
}

func (s *CategoryService) Search(query string) ([]dto.CategoryResponse, error) {
	cats, err := s.repo.Search(query)
	if err != nil {
		return nil, err
	}

	var res []dto.CategoryResponse
	for _, c := range cats {
		res = append(res, dto.CategoryResponse{
			ID:   c.CategoryID,
			Name: c.CategoryName,
		})
	}

	return res, nil
}