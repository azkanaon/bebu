package services

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"mime/multipart"
	"regexp"
	"time"

	"backend-bebu/config"
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"backend-bebu/pkg/utils"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Definisikan error custom agar bisa dicek di handler
var ErrUserAlreadyExists = errors.New("user with this email or username already exists")
var ErrInvalidPassword = errors.New("must be at least 8 characters and contain both letters and numbers")
var ErrInvalidCredentials = errors.New("invalid email/username or password")
var ErrInvalidRefreshToken = errors.New("invalid or expired refresh token")
var ErrInvalidResetToken = errors.New("invalid or expired reset token")
var ErrTooManyRequests = errors.New("too many failed login attempts, please try again later")

type AuthService interface {
	Register(req *dto.RegisterRequest, file *multipart.FileHeader) (*dto.RegisterResponse, error)
	Login(req *dto.LoginRequest, ipAddress, userAgent string) (string, string, *dto.LoginResponse, error)
	RefreshToken(refreshToken string) (string, error)
	RequestPasswordReset(req *dto.ForgotPasswordRequest) error
	ResetPassword(req *dto.ResetPasswordRequest) error
	Logout(refreshToken string) error
	ChangePassword(userID uint, req dto.ChangePasswordRequest) error
}


type authService struct {
	userRepo repositories.UserRepository
	rateLimiter *utils.LoginRateLimiter
}

// NewAuthService adalah constructor
func NewAuthService(userRepo repositories.UserRepository, limiter *utils.LoginRateLimiter) AuthService {
	return &authService{
		userRepo:   userRepo,
		rateLimiter: limiter,
	}
}

func (s *authService) Register(req *dto.RegisterRequest, file *multipart.FileHeader) (*dto.RegisterResponse, error){
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

	// 4. Proses upload file jika ada
	avatarURL, err := utils.UploadToCloudinary(file, "bebu/avatars")
	if err != nil {
		return nil, err
	}

	// 4. Siapkan model User dan UserProfile
	newUser := &models.User{
		Email:        req.Email,
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		// GORM akan otomatis membuatkan baris di tabel user_profiles
		Profile: &models.UserProfile{
			DisplayName: req.DisplayName,
			Bio:         req.Bio,
			Gender:      req.Gender,
			AvatarUrl:   avatarURL,
		},
		// GORM akan otomatis membuatkan baris di tabel user_settings dengan nilai default
		Settings: &models.UserSetting{
			IsProfilePublic:     true, // Default akun publik
			AllowDmFromPublic:   true,
			ShowActivityHeatmap: true,
		},
		// GORM akan otomatis membuatkan baris di tabel user_stats dengan nilai 0
		Stats: &models.UserStat{
			TotalFollowers:     0,
			TotalFollowing:     0,
			TotalPosts:         0,
			TotalBadges:        0,
			TotalAchievements:  0,
		}, 
		ReadingStats: &models.UserReadingStat{
            CurrentStreak: 0,
            LongestStreak: 0,
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
	response := &dto.RegisterResponse{
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

func (s *authService) Login(req *dto.LoginRequest, ipAddress, userAgent string) (string, string, *dto.LoginResponse, error) {

	// Buat kunci untuk rate limiter berdasarkan email/username dan IP address
	rateLimitKey := fmt.Sprintf("%s|%s", req.EmailOrUsername, ipAddress)

	if s.rateLimiter.IsBlocked(rateLimitKey) {
		return "", "", nil, ErrTooManyRequests
	}
	// 1. Cari user di database (sudah termasuk Preload("Profile"))
	user, err := s.userRepo.FindByEmailOrUsername(req.EmailOrUsername)
	if err != nil {
		ipKey := fmt.Sprintf("ip|%s", ipAddress)
		s.rateLimiter.RecordFailure(ipKey)

		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", "", nil, ErrInvalidCredentials
		}
		return "", "", nil, err // Error database lainnya
	}

	// 2. Bandingkan password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		s.rateLimiter.RecordFailure(rateLimitKey) // Catat kegagalan berdasarkan email/username + IP
		return "", "", nil, ErrInvalidCredentials
	}

	// JIKA LOGIN BERHASIL, bersihkan catatan kegagalan
	s.rateLimiter.ClearFailures(rateLimitKey)
	ipKey := fmt.Sprintf("ip|%s", ipAddress) // Juga bersihkan untuk IP-only
	s.rateLimiter.ClearFailures(ipKey)

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

	go func(id uint) {
        _ = s.userRepo.UpdateLastLogin(id)
    }(user.UserID)

	// 7. Siapkan response data (tidak berubah)
	loginResponse := &dto.LoginResponse{
		UserPublicID: user.PublicID,
		Username:     user.Username,
		DisplayName:  user.Profile.DisplayName,
		AvatarUrl:    user.Profile.AvatarUrl,
		Bio:          user.Profile.Bio,
		Gender:	   	  user.Profile.Gender,
		Role: 		  user.Role,		
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

func (s *authService) RequestPasswordReset(req *dto.ForgotPasswordRequest) error {
    // 1. Cari user berdasarkan email
    user, err := s.userRepo.FindByEmailOrUsername(req.Email)
    if err != nil {
        // PENTING: Jika user tidak ditemukan, jangan kembalikan error.
        // Cukup return nil agar tidak ada yang tahu email tersebut terdaftar atau tidak.
        // Ini mencegah serangan "user enumeration".
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil 
        }
        return err // Untuk error database lainnya
    }

    // 2. Generate kode numerik 6 digit yang aman
    code, err := generateSecureSixDigitCode()
    if err != nil {
        return err
    }

    // 3. Hash kode tersebut (gunakan SHA256, sama seperti refresh token)
    hasher := sha256.New()
    hasher.Write([]byte(code))
    tokenHash := hex.EncodeToString(hasher.Sum(nil))

    // 4. Siapkan record untuk disimpan
    passwordReset := &models.PasswordReset{
        UserID:    user.UserID,
        TokenHash: tokenHash,
        ExpiresAt: time.Now().Add(15 * time.Minute), // Berlaku 15 menit
    }
    
    // 5. Simpan ke database
    if err := s.userRepo.CreatePasswordReset(passwordReset); err != nil {
        return err
    }

    // 6. Kirim email ke pengguna (dengan kode yang asli, bukan hash)
    go utils.SendResetPasswordEmail(user.Email, code) // Gunakan goroutine agar tidak memblokir response

    return nil
}

// Fungsi helper untuk generate kode
func generateSecureSixDigitCode() (string, error) {
    const codeLength = 6
    const max = 10
    var code string
    for i := 0; i < codeLength; i++ {
        num, err := rand.Int(rand.Reader, big.NewInt(max))
        if err != nil {
            return "", err
        }
        code += num.String()
    }
    return code, nil
}

func (s *authService) ResetPassword(req *dto.ResetPasswordRequest) error {
	// 1. Validasi format password baru (bisa dibuat fungsi terpisah)
    if len(req.NewPassword) < 8 { return ErrInvalidPassword } // Dsb.

	// 2. Hash token yang masuk dari user
	hasher := sha256.New()
	hasher.Write([]byte(req.Token))
	tokenHash := hex.EncodeToString(hasher.Sum(nil))

	// 3. Cari token di database
	reset, err := s.userRepo.FindPasswordResetByTokenHash(tokenHash)
	if err != nil { return ErrInvalidResetToken }

	// 4. Validasi token
	if reset.UsedAt != nil || time.Now().After(reset.ExpiresAt) {
		return ErrInvalidResetToken
	}

	// 5. Hash password baru
	newPasswordHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil { return err }

	// 6. Panggil satu method repository yang akan menangani semuanya dalam satu transaksi
	err = s.userRepo.ResetPasswordTransaction(reset.UserID, string(newPasswordHash), reset.PasswordResetID)
	if err != nil {
		return err
	}

    return err
}

func (s *authService) Logout(refreshToken string) error {
	if refreshToken == "" {
		// Jika tidak ada token, tidak ada yang perlu dilakukan.
		return nil
	}

	// 1. Hash refresh token yang masuk, sama seperti saat refresh.
	hasher := sha256.New()
	hasher.Write([]byte(refreshToken))
	refreshTokenHash := hex.EncodeToString(hasher.Sum(nil))

	// 2. Panggil repository untuk membatalkan sesi.
	return s.userRepo.RevokeSessionByRefreshTokenHash(refreshTokenHash)
}

func (s *authService) ChangePassword(userID uint, req dto.ChangePasswordRequest) error {
	// 1. Ambil data user dari DB untuk dapet hash password lamanya
	user, err := s.userRepo.FindUserByID(userID)
	if err != nil {
		return err
	}

	// 2. Bandingkan Password Lama (input) dengan yang ada di DB (bcrypt)
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword))
	if err != nil {
		return errors.New("password lama salah")
	}

	// 3. Cek apakah password baru & konfirmasi cocok
	if req.NewPassword != req.ConfirmPassword {
		return errors.New("konfirmasi password tidak cocok")
	}

	// 4. Validasi kekuatan password baru (sama seperti saat Register)
	// hasNumber := ..., hasLetter := ..., dll.

	// 5. Hash password baru
	newHashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)

	// 6. Update ke Database
	return s.userRepo.UpdatePassword(userID, string(newHashedPassword))
}