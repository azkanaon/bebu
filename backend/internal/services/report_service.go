package services

import (
	"errors"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
)

type ReportService interface {
	ReportEntity(userID uint, entityID int, entityType string, reason string) error
}

type reportService struct {
	repo repositories.ReportRepository
}

func NewReportService(repo repositories.ReportRepository) ReportService {
	return &reportService{repo}
}

func (s *reportService) ReportEntity(userID uint, entityID int, entityType string, reason string) error {
	// Validasi EntityType agar tidak sembarang string masuk
	validTypes := map[string]bool{"post": true, "user": true, "comment": true}
	if !validTypes[entityType] {
		return errors.New("invalid entity type")
	}

	report := models.Report{
		UserID:     userID,
		EntityID:   entityID,
		EntityType: entityType,
		ReasonText: &reason, // Kategori yang dipilih user dari FE
	}

	return s.repo.CreateReport(&report)
}