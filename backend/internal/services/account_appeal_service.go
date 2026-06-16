package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"backend-bebu/internal/dto"
)

// DTO (Data Transfer Object) untuk request body
type CreateAppealRequest struct {
	AppealReason string `json:"appeal_reason"`
	EvidenceURL  *string `json:"evidence_url"`
}

type AccountAppealService interface {
	// User Side
	SubmitAppeal(ctx context.Context, userID uint, req CreateAppealRequest) (*models.AccountAppeal, error)

	// Admin Side
	GetAppealsForAdmin(ctx context.Context) ([]dto.AdminAppealListResponse, error)
	GetAppealDetailForAdmin(ctx context.Context, appealID uint) (*dto.AdminAppealDetailResponse, error)
	ProcessAppealAction(ctx context.Context, appealID uint, adminID uint, req dto.ActionAppealRequest) error
}

type accountAppealService struct {
	appealRepo repositories.AccountAppealRepository
}

func NewAccountAppealService(appealRepo repositories.AccountAppealRepository) AccountAppealService {
	return &accountAppealService{appealRepo: appealRepo}
}

func (s *accountAppealService) SubmitAppeal(ctx context.Context, userID uint, req CreateAppealRequest) (*models.AccountAppeal, error) {
	// 1. Validasi Input teks banding
	reason := strings.TrimSpace(req.AppealReason)
	if reason == "" {
		return nil, errors.New("alasan banding tidak boleh kosong")
	}
	if len(reason) < 20 {
		return nil, errors.New("alasan banding terlalu pendek, berikan penjelasan yang lebih detail (minimal 20 karakter)")
	}

	// 2. Aturan Bisnis: Cek apakah ada banding yang sedang berjalan (Pending)
	existingAppeal, err := s.appealRepo.GetPendingAppealByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("gagal mengecek riwayat banding: %w", err)
	}
	if existingAppeal != nil {
		return nil, errors.New("Anda sudah mengajukan banding sebelumnya. Mohon tunggu tim admin meninjau banding Anda")
	}

	// 3. Cari admin_action terakhir sebagai konteks hukuman
	latestAction, err := s.appealRepo.GetLatestSuspensionActionByUserID(ctx, userID)
	if err != nil {
		fmt.Printf("Peringatan: Gagal mencari riwayat admin action: %v\n", err)
	}

	var adminActionID *uint
	if latestAction != nil {
		adminActionID = &latestAction.AdminActionID
	}

	// 4. Buat objek data model beserta URL Bukti jika ada
	newAppeal := &models.AccountAppeal{
		UserID:        userID,
		AdminActionID: adminActionID,
		AppealReason:  reason,
		EvidenceURL:   req.EvidenceURL, // 💡 Simpan URL bukti gambar opsional ke model database
		Status:        "Pending",
	}

	// 5. Simpan ke Database melalui repo
	if err := s.appealRepo.CreateAppeal(ctx, newAppeal); err != nil {
		return nil, fmt.Errorf("gagal menyimpan pengajuan banding: %w", err)
	}

	return newAppeal, nil
}

// GetAppealsForAdmin memetakan data model mentah dari DB menjadi list ringkas siap pakai untuk FE tabel admin
func (s *accountAppealService) GetAppealsForAdmin(ctx context.Context) ([]dto.AdminAppealListResponse, error) {
	appeals, err := s.appealRepo.FindAllAppeals(ctx)
	if err != nil {
		return nil, err
	}

	var response []dto.AdminAppealListResponse
	for _, a := range appeals {
		response = append(response, dto.AdminAppealListResponse{
			AccountAppealID: a.AccountAppealID,
			Username:        a.User.Username,
			DisplayName:     a.User.Profile.DisplayName,
			Status:          a.Status,
			CreatedAt:       a.CreatedAt,
		})
	}
	return response, nil
}

// GetAppealDetailForAdmin merakit data mendalam untuk kebutuhan isi Pop-up modal peninjauan
func (s *accountAppealService) GetAppealDetailForAdmin(ctx context.Context, appealID uint) (*dto.AdminAppealDetailResponse, error) {
	appeal, err := s.appealRepo.FindAppealByID(ctx, appealID)
	if err != nil {
		return nil, err
	}

	suspensionReason := "Tidak ada catatan suspensi tertulis"

if appeal.AdminAction != nil && appeal.AdminAction.Reason != nil {
    suspensionReason = *appeal.AdminAction.Reason
}

	return &dto.AdminAppealDetailResponse{
		AccountAppealID:   appeal.AccountAppealID,
		UserID:            appeal.UserID,
		Username:          appeal.User.Username,
		AppealReason:      appeal.AppealReason,
		EvidenceURL:       appeal.EvidenceURL,
		Status:            appeal.Status,
		SuspensionReason:  suspensionReason,
		AdminNotes:        appeal.AdminNotes,
		ReviewedByAdminID: appeal.ReviewedByAdminID,
		ReviewedAt:        appeal.ReviewedAt,
		CreatedAt:         appeal.CreatedAt,
	}, nil
}

// ProcessAppealAction mengeksekusi logika perubahan status banding sekaligus memulihkan akun user jika diterima
func (s *accountAppealService) ProcessAppealAction(ctx context.Context, appealID uint, adminID uint, req dto.ActionAppealRequest) error {
	appeal, err := s.appealRepo.FindAppealByID(ctx, appealID)
	if err != nil {
		return err
	}

	if appeal.Status != "Pending" {
		return errors.New("banding ini sudah diproses sebelumnya dan tidak bisa diubah kembali")
	}

	now := time.Now()
	appeal.Status = req.Status
	appeal.AdminNotes = &req.AdminNotes
	appeal.ReviewedByAdminID = &adminID
	appeal.ReviewedAt = &now

	// Simpan keputusan berkas banding
	if err := s.appealRepo.UpdateAppealStatus(ctx, appeal); err != nil {
		return err
	}

	// JIKA DISETUJUI, kembalikan status akun pemilik banding menjadi active
	if req.Status == "Approved" {
		if err := s.appealRepo.UpdateUserStatus(ctx, appeal.UserID, "active"); err != nil {
			return err
		}
	}

	return nil
}