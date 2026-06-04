package repositories

import (
	"backend-bebu/internal/models"
	"backend-bebu/internal/dto"
	"gorm.io/gorm"

	"fmt"
	"strings"
	"context"
	"time"
	"errors"
)

type ReportRepository interface {
	CreateReportWithSummary(userID uint, entityID int, entityType string, reason string) error
	// Report Summary
	GetDashboardSummaries(filters dto.ReportFilterRequest) ([]dto.ReportDashboardResponse, int64, error)
	// Report Summary Detail
	GetSummaryByID(summaryID uint) (*models.ReportSummary, error)
	GetReasonCounts(summaryID uint) ([]dto.ReasonCount, error)
	GetTargetUserData(userID uint) (*dto.UserDetailReport, error)
	GetTargetPostData(postID uint) (*dto.PostDetailReport, error)
	GetLatestModerationAction(summaryID uint,) (*dto.ModerationHistory, error)
	// Admin Action
	GetReportSummaryByID(ctx context.Context, id uint) (*models.ReportSummary, error)
	ExecuteUserAction(ctx context.Context, summary *models.ReportSummary, action *models.AdminAction, targetUserStatus string) error
	ExecutePostAction(ctx context.Context, summary *models.ReportSummary, action *models.AdminAction, targetPostStatus string, isHardDelete bool) error
	ExecuteDismissAction(ctx context.Context, summary *models.ReportSummary, action *models.AdminAction) error
}

type reportRepository struct {
	db *gorm.DB
}

func NewReportRepository(db *gorm.DB) ReportRepository {
	return &reportRepository{db}
}

func (r *reportRepository) CreateReportWithSummary(userID uint, entityID int, entityType string, reason string) error {
	// Menggunakan GORM Transaction closure otomatis (Auto Rollback jika return err)
	return r.db.Transaction(func(tx *gorm.DB) error {
		var summary models.ReportSummary
		now := time.Now()

		// 1. Cek apakah Summary untuk entitas ini sudah ada atau belum
		err := tx.Where("entity_id = ? AND entity_type = ?", entityID, entityType).
			First(&summary).Error

		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				// Kasus A: JIKA BELUM ADA SUMMARY (Laporan Pertama untuk entitas ini)
				summary = models.ReportSummary{
					EntityID:      entityID,
					EntityType:    entityType,
					TotalReports:  1,
					UniqueReports: 1, // Pelapor pertama pasti unik
					Status:        "Not reviewed",
					FirstReport:   now,
					LastReport:    now,
				}
				if err := tx.Create(&summary).Error; err != nil {
					return err
				}
			} else {
				// Jika ada error DB lainnya
				return err
			}
		} else {
			// Kasus B: JIKA SUMMARY SUDAH ADA (Entitas ini sudah pernah dilaporkan oleh orang lain)
			
			// Opsional: Cek apakah user ini sudah pernah melaporkan entitas ini sebelumnya (untuk unique_reports)
			var count int64
			tx.Model(&models.Report{}).
				Where("report_summary_id = ? AND user_id = ?", summary.ReportSummaryID, userID).
				Count(&count)

			uniqueIncrement := 0
			if count == 0 {
				uniqueIncrement = 1 // User baru pertama kali melapor entitas ini
			}

			// Update Summary yang sudah ada
			err := tx.Model(&summary).Updates(map[string]interface{}{
				"total_reports":  gorm.Expr("total_reports + ?", 1),
				"unique_reports": gorm.Expr("unique_reports + ?", uniqueIncrement),
				"last_report":    now,
				"status":         "Not reviewed", // Kembalikan status ke Not Reviewed jika ada laporan baru masuk
			}).Error
			if err != nil {
				return err
			}
		}

		// 2. Buat Log Report baru yang mengikat ke ReportSummaryID yang didapatkan
		report := models.Report{
			ReportSummaryID: summary.ReportSummaryID, // Foreign key didapat dari step atas
			UserID:          userID,
			EntityID:        entityID,
			EntityType:      entityType,
			ReasonText:      &reason,
			CreatedAt:       now,
		}

		if err := tx.Create(&report).Error; err != nil {
			return err
		}

		return nil
	})
}

/* --- REPORT SUMMARY --- */

func (r *reportRepository) GetDashboardSummaries(filters dto.ReportFilterRequest) ([]dto.ReportDashboardResponse, int64, error) {
	var results []dto.ReportDashboardResponse
	var totalCount int64

	// Base Query Anda
	baseQuery := `
		SELECT * FROM (
			SELECT 
				rs.report_summary_id,
				rs.entity_id,
				rs.entity_type,
				rs.total_reports,
				rs.unique_reports,
				rs.last_report,
				rs.status,
				COALESCE(u.username, p.description, '') AS target
			FROM report_summaries rs
			LEFT JOIN users u ON rs.entity_type = 'user' AND rs.entity_id = u.user_id AND u.deleted_at IS NULL
			LEFT JOIN posts p ON rs.entity_type = 'post' AND rs.entity_id = p.post_id AND p.deleted_at IS NULL
		) AS aggregated_reports
		WHERE 1=1
	`
	var queryParams []interface{}

	// Filter Kondisional (Search, Status, Type)
	if filters.Search != "" {
		baseQuery += " AND target ILIKE ?"
		queryParams = append(queryParams, fmt.Sprintf("%%%s%%", filters.Search))
	}
	if filters.Status != "" {
		baseQuery += " AND status = ?"
		queryParams = append(queryParams, filters.Status)
	}
	if filters.Type != "" {
		baseQuery += " AND entity_type = ?"
		queryParams = append(queryParams, filters.Type)
	}

	// TAHAP A: Hitung total record yang lolos filter (Penting untuk kalkulasi jumlah halaman di FE)
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM (%s) AS count_table", baseQuery)
	if err := r.db.Raw(countQuery, queryParams...).Scan(&totalCount).Error; err != nil {
		return nil, 0, err
	}

	// TAHAP B: Saring data spesifik halaman dengan LIMIT & OFFSET
	baseQuery += " ORDER BY status DESC, last_report DESC"
	
	limit := 10
	if filters.Limit > 0 {
		limit = filters.Limit
	}
	page := 1
	if filters.Page > 0 {
		page = filters.Page
	}
	offset := (page - 1) * limit

	baseQuery += " LIMIT ? OFFSET ?"
	
	// Salin slice parameter lama lalu tambahkan limit & offset ke dalamnya
	dataParams := append([]interface{}{}, queryParams...)
	dataParams = append(dataParams, limit, offset)

	// Ambil data baris riil
	err := r.db.Raw(baseQuery, dataParams...).Scan(&results).Error
	if err != nil {
		return nil, 0, err
	}

	if results == nil {
		results = []dto.ReportDashboardResponse{}
	}

	return results, totalCount, nil
}

/* --- REPORT SUMMARY DETAIL --- */

func (r *reportRepository) GetSummaryByID(summaryID uint) (*models.ReportSummary, error) {
	var summary models.ReportSummary
	err := r.db.First(&summary, "report_summary_id = ?", summaryID).Error
	return &summary, err
}

func (r *reportRepository) GetReasonCounts(summaryID uint) ([]dto.ReasonCount, error) {
	var counts []dto.ReasonCount
	
	// Gunakan langsung r.db.Raw tanpa perlu r.db.Model di atasnya
	err := r.db.Raw(`
		SELECT reason_text, COUNT(*) as count 
		FROM reports 
		WHERE report_summary_id = ? 
		GROUP BY reason_text
		ORDER BY count DESC
	`, summaryID).Scan(&counts).Error
	
	if err != nil {
		return nil, err
	}
	return counts, nil
}

func (r *reportRepository) GetTargetUserData(userID uint) (*dto.UserDetailReport, error) {
	var res dto.UserDetailReport
	err := r.db.Raw(`
		SELECT 
			COALESCE(up.avatar_url, '') as avatar_url,
			COALESCE(up.display_name, '') as display_name,
			u.username,
			COALESCE(up.bio, '') as bio,
			u.created_at,
			u.status,
			u.email_verified,
			COALESCE(up.location, '') as location,
			COALESCE(us.total_followers, 0) as total_followers,
			COALESCE(us.total_following, 0) as total_following,
			COALESCE(us.total_posts, 0) as total_posts,
			COALESCE(us.hot_score, 0.0) as hot_score
		FROM users u
		LEFT JOIN user_profiles up ON u.user_id = up.user_id
		LEFT JOIN user_stats us ON u.user_id = us.user_id
		WHERE u.user_id = ? AND u.deleted_at IS NULL
	`, userID).Scan(&res).Error

	if err != nil {
		return nil, err
	}
	return &res, nil
}

func (r *reportRepository) GetTargetPostData(postID uint) (*dto.PostDetailReport, error) {
	var res dto.PostDetailReport
	var raw struct {
		Description   string
		PostType      string
		Username      string
		ImgURL        string
		PublishStatus string
		BookTitle     string
		PublicID      string
		LikeCount     int
		CommentCount  int
		ShareCount    int
		SaveCount     int
		HotScore      float64
	}

	err := r.db.Raw(`
		SELECT 
			p.description, p.post_type, u.username, p.img_url, p.publish_status, p.public_id,
			COALESCE(b.title, '') as book_title,
			COALESCE(ps.like_count, 0) as like_count,
			COALESCE(ps.comment_count, 0) as comment_count,
			COALESCE(ps.share_count, 0) as share_count,
			COALESCE(ps.save_count, 0) as save_count,
			COALESCE(ps.hot_score, 0.0) as hot_score
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.user_id
		LEFT JOIN books b ON p.book_id = b.book_id
		LEFT JOIN post_stats ps ON p.post_id = ps.post_id
		WHERE p.post_id = ? AND p.deleted_at IS NULL
	`, postID).Scan(&raw).Error

	if err != nil {
		return nil, err
	}

	// Buat logic slug: 8 char pertama public_id + title buku yang di-slugify sederhana
	shortID := ""
	if len(raw.PublicID) >= 8 {
		shortID = raw.PublicID[:8]
	} else {
		shortID = raw.PublicID
	}
	
	slugTitle := strings.ToLower(raw.BookTitle)
	slugTitle = strings.ReplaceAll(slugTitle, " ", "-") // Penggantian dasar space ke dash

	res = dto.PostDetailReport{
		PublicID:      raw.PublicID,
		Description:   raw.Description,
		PostType:      raw.PostType,
		Username:      raw.Username,
		ImgURL:        raw.ImgURL,
		PublishStatus: raw.PublishStatus,
		BookTitle:     raw.BookTitle,
		PostSlug:      fmt.Sprintf("%s-%s", shortID, slugTitle),
		LikeCount:     raw.LikeCount,
		CommentCount:  raw.CommentCount,
		ShareCount:    raw.ShareCount,
		SaveCount:     raw.SaveCount,
		HotScore:      raw.HotScore,
	}

	return &res, nil
}

func (r *reportRepository) GetLatestModerationAction(summaryID uint,) (*dto.ModerationHistory, error) {

	var res dto.ModerationHistory

	err := r.db.Raw(`
		SELECT
			aa.admin_action_id,
			aa.action_type,
			aa.reason,
			aa.duration_days,
			u.username AS admin_username,
			aa.created_at
		FROM admin_actions aa
		LEFT JOIN users u
			ON aa.admin_id = u.user_id
		WHERE aa.report_summary_id = ?
		ORDER BY aa.created_at DESC
		LIMIT 1
	`, summaryID).Scan(&res).Error

	if err != nil {
		return nil, err
	}

	// Jika tidak ada moderation action
	if res.AdminActionID == 0 {
		return nil, nil
	}

	return &res, nil
}

/* --- ADMIN ACTION --- */

func (r *reportRepository) GetReportSummaryByID(ctx context.Context, id uint) (*models.ReportSummary, error) {
	var summary models.ReportSummary
	err := r.db.WithContext(ctx).First(&summary, "report_summary_id = ?", id).Error
	return &summary, err
}

func (r *reportRepository) ExecuteUserAction(ctx context.Context, summary *models.ReportSummary, action *models.AdminAction, targetUserStatus string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Simpan Log Aksi Admin
		if err := tx.Create(action).Error; err != nil {
			return err
		}

		// 2. Update Status Summary Laporan
		if err := tx.Model(summary).Updates(models.ReportSummary{
			Status:          "Resolved",
			ReviewByAdminID: &action.AdminID,
			ReviewAt:        &action.CreatedAt,
			AdminNotes:      action.Reason,
		}).Error; err != nil {
			return err
		}

		// 3. Ubah Status Target User
		if err := tx.Model(&models.User{}).Where("user_id = ?", summary.EntityID).Update("status", targetUserStatus).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *reportRepository) ExecutePostAction(ctx context.Context, summary *models.ReportSummary, action *models.AdminAction, targetPostStatus string, isHardDelete bool) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Simpan Log Aksi Admin
		if err := tx.Create(action).Error; err != nil {
			return err
		}

		// 2. Update Status Summary Laporan
		if err := tx.Model(summary).Updates(models.ReportSummary{
			Status:          "Resolved",
			ReviewByAdminID: &action.AdminID,
			ReviewAt:        &action.CreatedAt,
			AdminNotes:      action.Reason,
		}).Error; err != nil {
			return err
		}

		// 3. Ubah Status Target Post (Soft Delete vs Hard Delete vs Shadowban)
		if isHardDelete {
			if err := tx.Unscoped().Delete(&models.Post{}, "post_id = ?", summary.EntityID).Error; err != nil {
				return err
			}
		} else {
			updates := map[string]interface{}{"publish_status": targetPostStatus}
			
			// Jika melakukan soft_delete bawaan GORM, set gorm.DeletedAt
			if targetPostStatus == "soft_deleted" {
				if err := tx.Delete(&models.Post{}, "post_id = ?", summary.EntityID).Error; err != nil {
					return err
				}
			}
			
			if err := tx.Model(&models.Post{}).Where("post_id = ?", summary.EntityID).Updates(updates).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *reportRepository) ExecuteDismissAction(ctx context.Context, summary *models.ReportSummary, action *models.AdminAction) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(action).Error; err != nil {
			return err
		}

		// Mengubah status summary menjadi 'Dismissed'
		return tx.Model(summary).Updates(models.ReportSummary{
			Status:          "Dismissed",
			ReviewByAdminID: &action.AdminID,
			ReviewAt:        &action.CreatedAt,
			AdminNotes:      action.Reason,
		}).Error
	})
}