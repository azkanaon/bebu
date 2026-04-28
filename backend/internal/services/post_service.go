package services

import (
	"errors"

	"backend-bebu/internal/mapper"
	"backend-bebu/internal/repositories"
	"backend-bebu/internal/dto"
	"backend-bebu/internal/utils"
	"backend-bebu/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostService struct {
	repo *repositories.PostRepository
	db   *gorm.DB
}

func NewPostService(repo *repositories.PostRepository, db *gorm.DB) *PostService {
	return &PostService{
		repo: repo,
		db:   db,
	}
}

func (s *PostService) GetPosts() ([]interface{}, error) {
	posts, err := s.repo.GetAllPosts() // TANPA filter type
	if err != nil {
		return nil, err
	}

	var result []interface{}

	for _, p := range posts {
		if p.PostType == "review" {
			result = append(result, mapper.ToReviewPostResponse(p))
		} else if p.PostType == "analysis" {
			result = append(result, mapper.ToAnalysisPostResponse(p))
		}
	}

	return result, nil
}

func (s *PostService) CreatePost(req dto.CreatePostRequest) error {
	tx := s.db.Begin()

	post := models.Post{
		PublicID:      uuid.New().String(),
		UserID:        req.UserID,
		BookID:        req.BookID,
		Description:   req.Description,
		PostType:      req.PostType,
		Rating:        req.Rating,
		ImgURL:        req.ImgURL,
		PublishStatus: "draft",
	}

	if err := tx.Create(&post).Error; err != nil {
		tx.Rollback()
		return err
	}

	if req.PostType == "analysis" {
		for _, name := range req.Categories {

			normalized := utils.NormalizeCategory(name)

			var category models.Category

			err := tx.Where("category_normalized = ?", normalized).
				First(&category).Error

			if errors.Is(err, gorm.ErrRecordNotFound) {

				category = models.Category{
					CategoryName:       name,
					CategoryNormalized: normalized,
					UsageCount:         1,
				}

				if err := tx.Create(&category).Error; err != nil {
					tx.Rollback()
					return err
				}

			} else if err != nil {
				tx.Rollback()
				return err
			} else {
				tx.Model(&category).
					Update("usage_count", gorm.Expr("usage_count + 1"))
			}

			postCategory := models.PostCategory{
				PostID:     post.PostID,
				CategoryID: category.CategoryID,
			}

			if err := tx.Create(&postCategory).Error; err != nil {
				tx.Rollback()
				return err
			}
		}
	}

	return tx.Commit().Error
}