// auth_service.go

package services

import (
	"errors"
	"regexp"
	"backend-bebu/internal/models" // Ganti 'backend-bebu'
	"backend-bebu/internal/repositories"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Definisikan error custom agar bisa dicek di handler
var ErrUserAlreadyExists = errors.New("user with this email or username already exists")
var ErrInvalidPassword = errors.New("must be at least 8 characters and contain both letters and numbers")

type AuthService interface {
	Register(req *models.RegisterRequest) (*models.RegisterResponse, error)
}

type authService struct {
	userRepo repositories.UserRepository
}

// NewAuthService adalah constructor
func NewAuthService(userRepo repositories.UserRepository) AuthService {
	return &authService{userRepo: userRepo}
}

func (s *authService) Register(req *models.RegisterRequest) (*models.RegisterResponse, error) {
	// 1. Validasi (bisa ditambahkan validator library di sini)

	// 2. Cek apakah user sudah ada
	existingUser, err := s.userRepo.FindByEmailOrUsername(req.Email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err // Error database yang sebenarnya
	}
	if existingUser != nil {
		return nil, ErrUserAlreadyExists
	}

	existingUser, err = s.userRepo.FindByEmailOrUsername(req.Username)
    if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
        return nil, err
    }
    if existingUser != nil {
        return nil, ErrUserAlreadyExists
    }


	// 3. Hash password
	checkPassword := req.Password
	// Validasi Panjang
	if len(checkPassword) < 8 {
		return nil, ErrInvalidPassword
	}

	// Validasi Angka (harus ada minimal satu angka)
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(checkPassword)

	// Validasi Huruf (harus ada minimal satu huruf)
	hasLetter := regexp.MustCompile(`[a-zA-Z]`).MatchString(checkPassword)

	// Kondisi yang kamu minta: Jika tidak terdiri dari angka DAN huruf
	if !hasNumber || !hasLetter {
		return nil, ErrInvalidPassword
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(checkPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// 4. Siapkan model User dan UserProfile
	newUser := &models.User{
		Email:        req.Email,
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		Profile: models.UserProfile{
			DisplayName: 	req.DisplayName,
			Bio:         	req.Bio,
			Gender:	  		req.Gender,
			AvatarUrl:  	req.AvatarUrl,
		},
	}
	// Jika display_name kosong, gunakan username
	if newUser.Profile.DisplayName == "" {
		newUser.Profile.DisplayName = newUser.Username
	}

	// 5. Simpan ke database melalui repository
	createdUser, err := s.userRepo.CreateUserAndProfile(newUser)
	if err != nil {
		return nil, err
	}

	// 6. Buat response DTO
	response := &models.RegisterResponse{
		UserPublicID: createdUser.PublicID,
		Username:     createdUser.Username,
		Email:        createdUser.Email,
		DisplayName:  createdUser.Profile.DisplayName,
		Bio:          createdUser.Profile.Bio,
		Gender:  createdUser.Profile.Gender,
		AvatarUrl:  createdUser.Profile.AvatarUrl,
	}

	return response, nil
}