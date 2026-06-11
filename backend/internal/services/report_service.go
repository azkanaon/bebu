package services

import (
	"backend-bebu/internal/models"
	"backend-bebu/internal/dto"
	"backend-bebu/internal/repositories"
	"backend-bebu/pkg/utils"
	"gorm.io/gorm"

	"errors"
	"context"
	"time"
	"math"
)

type ReportService interface {
	ReportEntity(userID uint, entityID int, entityType string, reason string) error
	GetReports(ctx context.Context, filters dto.ReportFilterRequest) (*dto.PaginatedReportResponse, error)
	GetSummaryPopUpDetail(summaryID uint) (*dto.ReportSummaryDetailResponse, error)
	ProcessAction(ctx context.Context, adminID uint, req dto.AdminActionRequest) (*dto.AdminActionResponse, error)
}

type reportService struct {
	repo repositories.ReportRepository
}

func NewReportService(repo repositories.ReportRepository) ReportService {
	return &reportService{repo}
}

func (s *reportService) ReportEntity(userID uint, entityID int, entityType string, reason string) error {
	if entityType == "comment" {
		entityType = "user"
	}

	validTypes := map[string]bool{
		"post": true, 
		"user": true, 
	}
	
	if !validTypes[entityType] {
		return errors.New("invalid entity type")
	}

	// 3. PROSES KE DB: Kirim nilai entityType yang sudah bersih ("user") ke repository
	return s.repo.CreateReportWithSummary(userID, entityID, entityType, reason)
}

func (s *reportService) GetReports(ctx context.Context, filters dto.ReportFilterRequest) (*dto.PaginatedReportResponse, error) {
    results, totalCount, err := s.repo.GetDashboardSummaries(filters)
    if err != nil {
        return nil, err
    }

    limit := 10
    if filters.Limit > 0 { limit = filters.Limit }
    page := 1
    if filters.Page > 0 { page = filters.Page }
    
    totalPages := int(math.Ceil(float64(totalCount) / float64(limit)))

    return &dto.PaginatedReportResponse{
        Data:        results,
        TotalCount:  totalCount,
        CurrentPage: page,
        TotalPages:  totalPages,
    }, nil
}

func (s *reportService) GetSummaryPopUpDetail(summaryID uint,) (*dto.ReportSummaryDetailResponse, error) {

	// 1. Ambil summary
	summary, err := s.repo.GetSummaryByID(summaryID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("report summary record not found")
		}

		return nil, err
	}

	// 2. Ambil reason counts
	reasons, err := s.repo.GetReasonCounts(summaryID)
	if err != nil {
		return nil, err
	}

	// 3. Base response
	response := &dto.ReportSummaryDetailResponse{
		ReportSummaryID: summary.ReportSummaryID,
		EntityID:        summary.EntityID,
		EntityType:      summary.EntityType,
		TotalReports:    summary.TotalReports,
		UniqueReports:   summary.UniqueReports,
		FirstReport:     summary.FirstReport,
		LastReport:      summary.LastReport,
		Status:          summary.Status,
		ReasonCounts:    reasons,
	}

	// 4. Ambil polymorphic entity data
	if summary.EntityType == "user" {

		userData, err :=
			s.repo.GetTargetUserData(
				uint(summary.EntityID),
			)

		if err == nil {
			response.UserData = userData
		}

	} else if summary.EntityType == "post" {

		postData, err :=
			s.repo.GetTargetPostData(
				uint(summary.EntityID),
			)

		if err == nil {
			response.PostData = postData
		}
	}

	// 5. Ambil moderation history
	moderationHistory, err :=
		s.repo.GetLatestModerationAction(summaryID)

	if err == nil {
		response.ModerationHistory =
			moderationHistory
	}

	return response, nil
}

/* --- ADMIN ACTION --- */
func (s *reportService) ProcessAction(ctx context.Context, adminID uint, req dto.AdminActionRequest) (*dto.AdminActionResponse, error) {
	// Ambil meta summary data
	summary, err := s.repo.GetReportSummaryByID(ctx, req.ReportSummaryID)
	if err != nil {
		return nil, errors.New("report summary intelligence case not found")
	}

	if summary.Status == "Resolved" || summary.Status == "Dismissed" {
		return nil, errors.New("this report summary case has already been processed")
	}

	// Menyiapkan Objek Log Tindakan Admin
	now := time.Now()
	actionLog := &models.AdminAction{
		ReportSummaryID: &req.ReportSummaryID,
		AdminID:         adminID,
		ActionType:      req.ActionType,
		EntityType:      &summary.EntityType,
		EntityID:        &summary.EntityID,
		Reason:          &req.Reason,
		DurationDays:    req.DurationDays,
		CreatedAt:       now,
	}

	// Variabel untuk menampung URL gambar yang akan dihapus di Cloudinary nanti
	imageToDeleteURL := ""

	// Matriks Keputusan Berdasarkan Tipe Entitas & Aksi
	switch req.ActionType {
	case "dismiss":
		if err := s.repo.ExecuteDismissAction(ctx, summary, actionLog); err != nil {
			return nil, err
		}
		return &dto.AdminActionResponse{Message: "Case cleared and dismissed successfully", Status: "dismissed"}, nil

	// ==================== USER ENTITY CASE ====================
	case "warning", "shadowban_user", "suspend", "ban_permanent":
		if summary.EntityType != "user" {
			return nil, errors.New("invalid operation: choice action mismatch with user entity")
		}

		if req.ActionType == "ban_permanent" {
			// Ambil data profil untuk melihat apakah user memiliki avatar custom
			profile, err := s.repo.GetUserProfileForModeration(ctx, uint(summary.EntityID))
			if err == nil && profile != nil && profile.AvatarUrl != "" {
				imageToDeleteURL = profile.AvatarUrl
			}
		}

		targetStatus := "active"
		if req.ActionType == "shadowban_user" {
			targetStatus = "shadowbanned"
		} else if req.ActionType == "suspend" {
			targetStatus = "suspended"
		} else if req.ActionType == "ban_permanent" {
			targetStatus = "banned"
		}

		if err := s.repo.ExecuteUserAction(ctx, summary, actionLog, targetStatus); err != nil {
			return nil, err
		}

	// ==================== POST ENTITY CASE ====================
	case "shadowban_post", "soft_delete", "hard_delete":
		if summary.EntityType != "post" {
			return nil, errors.New("invalid operation: choice action mismatch with post entity")
		}

		// Ambil data postingan lama untuk dianalisis datanya
		post, err := s.repo.GetPostForModeration(ctx, uint(summary.EntityID))
		if err != nil {
			return nil, errors.New("post target entity record not found")
		}

		targetStatus := "published"
		isHardDelete := false

		if req.ActionType == "shadowban_post" {
			targetStatus = "shadowbanned"
		} else if req.ActionType == "soft_delete" {
			targetStatus = "soft_deleted"
			
			if post.PostType == "analysis" && post.ImgURL != "" {
				imageToDeleteURL = post.ImgURL
			}
		} else if req.ActionType == "hard_delete" {
			isHardDelete = true

			// Hanya hapus jika postingan ini belum pernah di-soft-delete sebelumnya (gambarnya masih eksis)
			if !post.DeletedAt.Valid && post.PostType == "analysis" && post.ImgURL != "" {
				imageToDeleteURL = post.ImgURL
			}
		}

		if err := s.repo.ExecutePostAction(ctx, summary, actionLog, targetStatus, isHardDelete); err != nil {
			return nil, err
		}

	default:
		return nil, errors.New("unknown administrative moderation verdict type")
	}

	// EKSEKUSI PENGHAPUSAN CLOUDINARY
	if imageToDeleteURL != "" {
		_ = utils.DeleteFromCloudinary(imageToDeleteURL)
	}

	return &dto.AdminActionResponse{
		Message: "Administrative strategic action executed successfully",
		Status:  "success",
	}, nil
}