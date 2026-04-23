// auth_dto.go

package models

import "github.com/google/uuid"

// RegisterRequest adalah struktur data yang diharapkan dari body request pendaftaran
type RegisterRequest struct {
	Username    	string `form:"username" binding:"required,min=4,max=50"`
	Email       	string `form:"email" binding:"required"`
	Password    	string `form:"password" binding:"required,min=8"`
	DisplayName 	string `form:"display_name"`
	Bio 			string `form:"bio"`
	Gender 			string `form:"gender"`
	AvatarUrl 		string `form:"avatar_url"`
}

// RegisterResponse adalah struktur data yang dikirim kembali setelah pendaftaran berhasil
type RegisterResponse struct {
	UserPublicID uuid.UUID `json:"user_public_id"`
	Username     	string    `json:"username"`
	Email        	string    `json:"email"`
	DisplayName 	string `json:"display_name"`
	Bio 			string `json:"bio"`
	Gender 			string `json:"gender"`
	AvatarUrl 		string `json:"avatar_url"`
}

// LoginRequest adalah struktur data untuk body request login
type LoginRequest struct {
	EmailOrUsername string `json:"email_or_username" binding:"required"`
	Password        string `json:"password" binding:"required"`
}

// LoginResponse adalah data yang dikirim kembali ke client setelah login sukses
type LoginResponse struct {
	UserPublicID uuid.UUID `json:"user_public_id"`
	Username     string    `json:"username"`
	DisplayName  string    `json:"display_name"`
	AvatarUrl    string    `json:"avatar_url"`
	Bio          string    `json:"bio"`
	Gender       string    `json:"gender"`
}