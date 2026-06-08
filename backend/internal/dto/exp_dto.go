package dto

// Request payload dari aksi user (misal via internal/routing)
type RewardExpRequest struct {
	UserID     uint   `json:"user_id" validate:"required"`
	SourceID   *uint  `json:"source_id"`
	SourceType string `json:"source_type" validate:"required"` // e.g., "POST_REVIEW", "GET_LIKE"
}