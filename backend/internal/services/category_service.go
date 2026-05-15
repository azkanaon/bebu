package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/repositories"
	"errors"
)

type CategoryService interface {
	GetUserCategories(userID uint) ([]dto.CategoryResponse, error)
	GetAllCategories(userID uint) ([]dto.CategoryWithStatus, error)
	Search(query string) ([]dto.CategoryResponse, error)
	FavoriteCategory(userID, categoryID uint) error
	UnfavoriteCategory(userID, categoryID uint) error
}

type categoryService struct {
	categoryRepo repositories.CategoryRepository
}

func NewCategoryService(categoryRepo repositories.CategoryRepository) CategoryService {
	return &categoryService{categoryRepo: categoryRepo}
}

func (s *categoryService) GetUserCategories(userID uint) ([]dto.CategoryResponse, error) {
	categories, err := s.categoryRepo.GetUserFavoriteCategories(userID)
	if err != nil {
		return nil, err
	}

	response := make([]dto.CategoryResponse, 0)
	for _, cat := range categories {
		response = append(response, dto.CategoryResponse{
			ID:   cat.CategoryID,
			Name: cat.CategoryName,
		})
	}

	return response, nil
}

func (s *categoryService) GetAllCategories(userID uint) ([]dto.CategoryWithStatus, error) {
	return s.categoryRepo.GetAllCategoriesWithFavoriteStatus(userID)
}

func (s *categoryService) Search(query string) ([]dto.CategoryResponse, error) {
	cats, err := s.categoryRepo.Search(query)
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

func (s *categoryService) FavoriteCategory(userID, categoryID uint) error {
	count, err := s.categoryRepo.CountUserCategories(userID)
	if err != nil {
		return err
	}
	if count >= 10 {
		return errors.New("maximum_limit_reached")
	}

	isFavorited, err := s.categoryRepo.IsCategoryFavorited(userID, categoryID)
	if err != nil {
		return err
	}
	if isFavorited {
		return errors.New("already_favorited")
	}

	return s.categoryRepo.AddFavoriteCategory(userID, categoryID)
}

func (s *categoryService) UnfavoriteCategory(userID, categoryID uint) error {
	return s.categoryRepo.RemoveFavoriteCategory(userID, categoryID)
}