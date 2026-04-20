// auth_dto.go

package models

import "github.com/google/uuid"

// RegisterRequest adalah struktur data yang diharapkan dari body request pendaftaran
type RegisterRequest struct {
	Username    	string `json:"username" validate:"required,min=3,max=100"`
	Email       	string `json:"email" validate:"required,email"`
	Password    	string `json:"password" validate:"required,min=8"`
	DisplayName 	string `json:"display_name,omitempty"`
	Bio 			string `json:"bio,omitempty"`
	Gender 			string `json:"gender,omitempty"`
	AvatarUrl 		string `json:"avatar_url,omitempty"`
}

// RegisterResponse adalah struktur data yang dikirim kembali setelah pendaftaran berhasil
type RegisterResponse struct {
	UserPublicID uuid.UUID `json:"user_public_id"`
	Username     	string    `json:"username"`
	Email        	string    `json:"email"`
	DisplayName 	string `json:"display_name,omitempty"`
	Bio 			string `json:"bio,omitempty"`
	Gender 			string `json:"gender,omitempty"`
	AvatarUrl 		string `json:"avatar_url,omitempty"`
}