package dto

import "time"

// Request payload untuk filter & pagination
type UserManagementFilterRequest struct {
	Search string `form:"search" json:"search"`
	Status string `form:"status" json:"status"`
	Role   string `form:"role" json:"role"`
	Page   int    `form:"page" json:"page"`
	Limit  int    `form:"limit" json:"limit"`
}

// Item response data untuk tabel admin
type UserManagementResponse struct {
	UserID        uint       `json:"user_id"`
	Username      string     `json:"username"`
	Email         string     `json:"email"`
	Role          string     `json:"role"`
	Status        string     `json:"status"`
	IsActive      bool       `json:"is_active"`
	EmailVerified bool       `json:"email_verified"`
	LastLogin     *time.Time `json:"last_login"`
	CreatedAt     time.Time  `json:"created_at"`
	DisplayName   string     `json:"display_name"` // Ringan, diambil via selective join
	AvatarUrl     string     `json:"avatar_url"`   // Ringan, diambil via selective join
}

// Wrapper format server-side pagination
type PaginatedUserResponse struct {
	Data        []UserManagementResponse `json:"data"`
	TotalCount  int64                    `json:"total_count"`
	CurrentPage int                      `json:"current_page"`
	TotalPages  int                      `json:"total_pages"`
}

// Request payload untuk mengubah status tindakan admin
type UpdateUserStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=active suspended banned"`
}