package dto

import "time"

// --- REQUEST DTO ---

// ActionAppealRequest digunakan admin untuk menyetujui atau menolak banding
type ActionAppealRequest struct {
	Status     string `json:"status" binding:"required,oneof=Approved /> Rejected"`
	AdminNotes string `json:"adminNotes" binding:"required,min=5"`
}

// --- RESPONSE DTO ---

// AdminAppealListResponse adalah ringkasan data untuk tabel utama admin
type AdminAppealListResponse struct {
	AccountAppealID uint      `json:"accountAppealID"`
	Username        string    `json:"username"`
	DisplayName     string    `json:"displayName"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"createdAt"`
}

// AdminAppealDetailResponse adalah data lengkap yang akan dimuat di dalam Pop-up Admin
type AdminAppealDetailResponse struct {
	AccountAppealID   uint       `json:"accountAppealID"`
	UserID            uint       `json:"userID"`
	Username          string     `json:"username"`
	AppealReason      string     `json:"appealReason"`
	EvidenceURL       *string    `json:"evidenceURL,omitempty"`
	Status            string     `json:"status"`
	SuspensionReason  string     `json:"suspensionReason"` // Konteks kasus kenapa di-suspend
	AdminNotes        *string    `json:"adminNotes,omitempty"`
	ReviewedByAdminID *uint      `json:"reviewedByAdminID,omitempty"`
	ReviewedAt        *time.Time `json:"reviewedAt,omitempty"`
	CreatedAt         time.Time  `json:"createdAt"`
}