package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
)

// DTO (Data Transfer Object) untuk request body
type CreateAppealRequest struct {
	AppealReason string `json:"appeal_reason"`
	EvidenceURL  *string `json:"evidence_url"`
}

type AccountAppealService interface {
	SubmitAppeal(ctx context.Context, userID uint, req CreateAppealRequest) (*models.AccountAppeal, error)
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