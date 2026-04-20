// auth_service.go

package services

import (
	"errors"
	"regexp"
	"backend-bebu/internal/models" // Ganti 'backend-bebu'
	"backend-bebu/internal/repositories"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"time"
	"backend-bebu/config"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Definisikan error custom agar bisa dicek di handler
var ErrUserAlreadyExists = errors.New("user with this email or username already exists")
var ErrInvalidPassword = errors.New("must be at least 8 characters and contain both letters and numbers")
var ErrInvalidCredentials = errors.New("invalid email/username or password")

type AuthService interface {
	Register(req *models.RegisterRequest) (*models.RegisterResponse, error)
	Login(req *models.LoginRequest) (string, *models.LoginResponse, error)
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

func (s *authService) Login(req *models.LoginRequest) (string, *models.LoginResponse, error) {
	// 1. Cari user di database
	user, err := s.userRepo.FindByEmailOrUsername(req.EmailOrUsername)
	if err != nil {
		// Jika record tidak ditemukan atau error lain, kembalikan error kredensial.
		// Ini mencegah "user enumeration attacks".
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil, ErrInvalidCredentials
		}
		return "", nil, err // Error database lainnya
	}

	// 2. Bandingkan password yang di-hash dengan password yang diberikan
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		// Jika password salah, bcrypt akan mengembalikan error
		return "", nil, ErrInvalidCredentials
	}

	// 3. Generate JWT Token
	token, err := generateJWT(user.PublicID)
	if err != nil {
		return "", nil, err
	}

	// 4. Siapkan data response
	// Kita perlu memuat profile-nya. Tambahkan method di repo jika perlu,
	// atau pastikan FindBy... sudah me-load relasi Profile (Preload).
	// Untuk sekarang, kita asumsikan 'user' sudah mengandung data profile.
	loginResponse := &models.LoginResponse{
		UserPublicID: user.PublicID,
		Username:     user.Username,
		DisplayName:  user.Profile.DisplayName,
		AvatarUrl:    user.Profile.AvatarUrl,
		Bio:          user.Profile.Bio,
		Gender:	   	  user.Profile.Gender,
	}

	return token, loginResponse, nil
}

// generateJWT adalah fungsi helper untuk membuat token
func generateJWT(userPublicID uuid.UUID) (string, error) {
	// Tentukan durasi token (ambil dari config)
	expirationTime := time.Now().Add(time.Duration(config.JWTExpirationInMinutes) * time.Minute)

	// Buat claims (payload)
	claims := &jwt.RegisteredClaims{
		Subject:   userPublicID.String(),
		ExpiresAt: jwt.NewNumericDate(expirationTime),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}

	// Buat token dengan claims dan metode signing
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Tandatangani token dengan secret key
	tokenString, err := token.SignedString([]byte(config.JWTSecretKey))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}