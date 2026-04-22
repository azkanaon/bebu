// auth_service.go

package services

import (
	"errors"
	"regexp"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"crypto/sha256"
	"encoding/hex"
	"crypto/rand"
	"encoding/base64"

	"time"
	"backend-bebu/config"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Definisikan error custom agar bisa dicek di handler
var ErrUserAlreadyExists = errors.New("user with this email or username already exists")
var ErrInvalidPassword = errors.New("must be at least 8 characters and contain both letters and numbers")
var ErrInvalidCredentials = errors.New("invalid email/username or password")
var ErrInvalidRefreshToken = errors.New("invalid or expired refresh token")

type AuthService interface {
	Register(req *models.RegisterRequest) (*models.RegisterResponse, error)
	Login(req *models.LoginRequest, ipAddress, userAgent string) (string, string, *models.LoginResponse, error)
	RefreshToken(refreshToken string) (string, error)
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
		Profile: &models.UserProfile{
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
		Gender:		  createdUser.Profile.Gender,
		AvatarUrl:    createdUser.Profile.AvatarUrl,
	}

	return response, nil
}

func (s *authService) Login(req *models.LoginRequest, ipAddress, userAgent string) (string, string, *models.LoginResponse, error) {
	// 1. Cari user di database (sudah termasuk Preload("Profile"))
	user, err := s.userRepo.FindByEmailOrUsername(req.EmailOrUsername)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", "", nil, ErrInvalidCredentials
		}
		return "", "", nil, err // Error database lainnya
	}

	// 2. Bandingkan password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		return "", "", nil, ErrInvalidCredentials
	}

	// 3. Generate Access Token (JWT) - seperti sebelumnya
	accessToken, err := generateJWT(user.PublicID)
	if err != nil {
		return "", "", nil, err
	}

	// 4. Generate Refresh Token (string acak yang aman)
	refreshTokenBytes := make([]byte, 32)
	if _, err := rand.Read(refreshTokenBytes); err != nil {
		return "", "", nil, err
	}
	refreshToken := base64.URLEncoding.EncodeToString(refreshTokenBytes)

	// 5. Hash Refresh Token menggunakan SHA256
	hasher := sha256.New()
	hasher.Write([]byte(refreshToken))
	refreshTokenHash := hex.EncodeToString(hasher.Sum(nil))

	// 6. Buat entri sesi baru untuk disimpan
	session := &models.UserSession{
		UserID:           user.UserID,
		RefreshTokenHash: refreshTokenHash,
		DeviceInfo:       userAgent,
		IpAddress:        ipAddress,
		ExpiresAt:        time.Now().Add(30 * 24 * time.Hour), // Berlaku 30 hari
	}
    
    // Simpan sesi ke database
    if err := s.userRepo.CreateSession(session); err != nil {
        return "", "", nil, err
    }

	// 7. Siapkan response data (tidak berubah)
	loginResponse := &models.LoginResponse{
		UserPublicID: user.PublicID,
		Username:     user.Username,
		DisplayName:  user.Profile.DisplayName,
		AvatarUrl:    user.Profile.AvatarUrl,
		Bio:          user.Profile.Bio,
		Gender:	   	  user.Profile.Gender,
	}

	// 8. Kembalikan KEDUA token
	return accessToken, refreshToken, loginResponse, nil
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

func (s *authService) RefreshToken(refreshToken string) (string, error) {
	if refreshToken == "" { return "", ErrInvalidRefreshToken }

	// 1. Hash token yang masuk
	hasher := sha256.New()
	hasher.Write([]byte(refreshToken))
	refreshTokenHash := hex.EncodeToString(hasher.Sum(nil))

	// 2. Cari sesi
	session, err := s.userRepo.FindSessionByRefreshTokenHash(refreshTokenHash)
	if err != nil { return "", ErrInvalidRefreshToken }

	// 3. Validasi sesi
	if session.RevokedAt != nil || time.Now().After(session.ExpiresAt) {
		// Opsional: Hapus sesi yang sudah tidak valid dari DB
		return "", ErrInvalidRefreshToken
	}

	// 4. Ambil data user dari UserID di sesi
	user, err := s.userRepo.FindUserByID(session.UserID)
	if err != nil { return "", ErrInvalidRefreshToken }

	// 5. Buat Access Token baru
	newAccessToken, err := generateJWT(user.PublicID)
	if err != nil { return "", err }

	return newAccessToken, nil
}