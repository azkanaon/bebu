package dto

import "time"

// PostQueryParams menyimpan kriteria filter server-side
type PostQueryParams struct {
	Page          int    `form:"page" json:"page"`
	Limit         int    `form:"limit" json:"limit"`
	Search        string `form:"search" json:"search"`                 // Mencari deskripsi post atau judul buku
	PublishStatus string `form:"publish_status" json:"publish_status"` // "published", "shadowbanned", "soft_deleted"
}

// PostManageableResponse membungkus representasi data post untuk tabel admin
type PostManageableResponse struct {
	PostID        uint      `json:"post_id"`
	Description   string    `json:"description"`
	PostType      string    `json:"post_type"`
	Rating        float64   `json:"rating"`
	ImgURL        string    `json:"img_url"`
	PublishStatus string    `json:"publish_status"` // "published", "shadowbanned", "soft_deleted"
	CreatedAt     time.Time `json:"created_at"`
	
	// Data Relasi Terkait
	Username      string    `json:"username"`
	BookTitle     string    `json:"book_title"`
	
	// Stats Ringkas
	LikeCount     int       `json:"like_count"`
	CommentCount  int       `json:"comment_count"`
}

// PaginatedPostAPIResponse membungkus payload output berpaginasi
type PaginatedPostAPIResponse struct {
	Data       []PostManageableResponse `json:"data"`
	TotalRows  int64                    `json:"total_rows"`
	TotalPages int                      `json:"total_pages"`
	Page       int                      `json:"page"`
	Limit      int                      `json:"limit"`
}

// UpdatePostStatusRequest menangkap payload mutasi status dari admin
type UpdatePostStatusRequest struct {
	// Sesuai instruksi, admin hanya diizinkan memilih 3 state ini melalui panel manajemen post langsung
	Status string `json:"status" binding:"required,oneof=published soft_delete hard_delete"`
}