package dto

import "time"

// NotificationResponseDTO adalah data yang dikirim ke Frontend
type NotificationResponseDTO struct {
	ID               uint      `json:"id"`
	ActorUsername    string    `json:"actorUsername"` // Username orang terbaru yang melakukan aksi
	ActorDisplayName string    `json:"actorDisplayName"` 
	ActorAvatar      string    `json:"actorAvatar"`
	Type             string    `json:"type"`             // POST_LIKE, POST_COMMENT, FOLLOW_REQUEST, dll
	EntityType       string    `json:"entityType"`       // posts, users, books
	EntityID         uint      `json:"entityId"`         // ID dari post/user/book yang bersangkutan
	ExtraActorsCount int       `json:"extraActorsCount"` // Jumlah orang lainnya (untuk agregasi)
	IsRead           bool      `json:"isRead"`
	CreatedAt        time.Time `json:"createdAt"`        // Kita gunakan UpdatedAt dari model sebagai CreatedAt di DTO
}

// NotificationListResponse adalah wrapper untuk mendukung infinite scroll
type NotificationListResponse struct {
	Data []NotificationResponseDTO `json:"data"`
	Meta *PaginationDTO            `json:"meta"`
}