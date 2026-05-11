package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/repositories"
)

type PlatformService interface {
	GetPlatforms() ([]dto.PlatformResponseDTO, error)
}

type platformService struct {
	repo repositories.PlatformRepository
}

func NewPlatformService(repo repositories.PlatformRepository) PlatformService {
	return &platformService{repo: repo}
}

func (s *platformService) GetPlatforms() ([]dto.PlatformResponseDTO, error) {
	platforms, err := s.repo.GetAllPlatforms()
	if err != nil {
		return nil, err
	}

	dtos := make([]dto.PlatformResponseDTO, len(platforms))
	for i, p := range platforms {
		dtos[i] = dto.PlatformResponseDTO{
			ID:   p.PlatformID,
			Name: p.PlatformName,
			Slug: p.Slug,
		}
	}
	return dtos, nil
}