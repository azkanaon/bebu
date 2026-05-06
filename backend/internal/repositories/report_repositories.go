package repositories

import (
	"backend-bebu/internal/models"
	"gorm.io/gorm"
)

type ReportRepository interface {
	CreateReport(report *models.Report) error
}

type reportRepository struct {
	db *gorm.DB
}

func NewReportRepository(db *gorm.DB) ReportRepository {
	return &reportRepository{db}
}

func (r *reportRepository) CreateReport(report *models.Report) error {
	return r.db.Create(report).Error
}