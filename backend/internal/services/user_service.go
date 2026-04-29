package services

import (
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"backend-bebu/pkg/utils"
	"context"
	"errors"
	"fmt"
	"mime/multipart"

	"golang.org/x/sync/errgroup" // Untuk menjalankan query concurrent
	"gorm.io/gorm"
)


type UserService interface {
	GetProfileByUsername(username string, viewerID *uint) (*ProfileResponseDTO, error)
	FollowUser(sourceUserID uint, targetUsername string) error
	UnfollowUser(sourceUserID uint, targetUsername string) error
	UpdateProfile(userID uint, req *UpdateProfileRequestDTO, avatarFile *multipart.FileHeader) (*ProfileInfoDTO, error)
}

type userService struct {
	db       *gorm.DB
	userRepo repositories.UserRepository
	// postRepo repositories.PostRepository // Kita akan butuh ini untuk postCount
}

func NewUserService(db *gorm.DB, userRepo repositories.UserRepository) UserService { // <-- TERIMA DB
	return &userService{
		db:       db, // <-- SIMPAN DB
		userRepo: userRepo,
	}
}

func (s *userService) GetProfileByUsername(username string, viewerID *uint) (*ProfileResponseDTO, error) {
	// 1. Dapatkan data user utama
	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		// Handle error, misal: not found
		return nil, err
	}

	// Tentukan apakah ini profil milik viewer
	isOwnProfile := viewerID != nil && *viewerID == user.UserID

	// 2. LOGIKA BISNIS: Cek apakah profil ini privat dan harus disembunyikan
	// user.Setting mungkin nil jika user belum punya setting, jadi kita perlu cek.
	isProfilePrivate := user.Settings != nil && !user.Settings.IsProfilePublic

	if isProfilePrivate && !isOwnProfile {
		// Jika profilnya privat DAN bukan pemilik yang lihat, kembalikan data terbatas.
		return s.mapToPrivateProfileDTO(user), nil
	}
	
	// 2. Dapatkan data agregat (count) secara concurrent untuk performa
	var followerCount, followingCount int64
	// var postCount int64
	
	g, _ := errgroup.WithContext(context.Background())

	g.Go(func() error {
		var err error
		followerCount, err = s.userRepo.GetFollowerCount(user.UserID)
		return err
	})
	g.Go(func() error {
		var err error
		followingCount, err = s.userRepo.GetFollowingCount(user.UserID)
		return err
	})
	// g.Go(func() error { ... get postCount from postRepo ... })

	if err := g.Wait(); err != nil {
		return nil, err
	}
	
	// 3. Jika ada viewer (user login), cek konteksnya
	var viewerContext *ViewerContextDTO
	if viewerID != nil && *viewerID != user.UserID {
		var isFollowing, isBlocked bool
		
		g, _ := errgroup.WithContext(context.Background())
		g.Go(func() error {
			var err error
			isFollowing, err = s.userRepo.IsFollowing(*viewerID, user.UserID)
			return err
		})
		g.Go(func() error {
			var err error
			isBlocked, err = s.userRepo.IsBlocked(*viewerID, user.UserID)
			return err
		})

		if err := g.Wait(); err != nil {
			return nil, err
		}
		
		viewerContext = &ViewerContextDTO{
			IsFollowing: isFollowing,
			IsBlocked:   isBlocked,
			IsOwnProfile: false,
		}
	} else if viewerID != nil && *viewerID == user.UserID {
		viewerContext = &ViewerContextDTO{ IsOwnProfile: true }
	}

	// 4. Transformasi/Mapping dari Model ke DTO
	response := s.mapToPublicProfileDTO(user, followerCount, followingCount, viewerContext)

	return response, nil
}

func (s *userService) mapToPublicProfileDTO(
	user *models.User,
	followerCount, followingCount int64,
	ctx *ViewerContextDTO,
) *ProfileResponseDTO {

	// 1. Mapping Social Links
	socialLinks := make([]SocialLinkDTO, len(user.SocialLinks))
	for i, link := range user.SocialLinks {
		dto := SocialLinkDTO{
			PlatformName: link.Platform.PlatformName,
			URL:          link.SocialURL,
		}
        // PERBAIKAN DI SINI: Cek pointer nil sebelum digunakan
		if link.Platform.PlatformImageURL != nil {
			dto.PlatformImageUrl = *link.Platform.PlatformImageURL
		}
		socialLinks[i] = dto
	}

	// 2. Mapping Badges
	badges := make([]BadgeDTO, len(user.Badges))
	for i, badge := range user.Badges {
		dto := BadgeDTO{
			BadgeName: badge.BadgeName,
		}
        // PERBAIKAN DI SINI: Cek pointer nil
		if badge.LogoURL != nil {
			dto.LogoURL = *badge.LogoURL
		}
		if badge.Description != nil {
			dto.Description = *badge.Description
		}
		badges[i] = dto
	}

	// 3. Mapping Achievements
	achievements := make([]AchievementDTO, len(user.UserAchievements))
    for i, ua := range user.UserAchievements {
		dto := AchievementDTO{
			AchievementName: ua.Achievement.AchievementName,
			EarnedAt:        ua.EarnedAt,
		}
        // PERBAIKAN DI SINI: Cek pointer nil
		if ua.Achievement.LogoURL != nil {
			dto.LogoURL = *ua.Achievement.LogoURL
		}
		if ua.Achievement.Description != nil {
			dto.Description = *ua.Achievement.Description
		}
		achievements[i] = dto
	}

	// 4. Merakit DTO utama
	dto := &ProfileResponseDTO{
		PublicID: user.PublicID.String(),
		Username: user.Username,
		Profile: ProfileInfoDTO{
			DisplayName: user.Profile.DisplayName,
			AvatarURL:   user.Profile.AvatarUrl,
			Bio:         user.Profile.Bio,
			Location:    user.Profile.Location,
			JoinedAt:    user.CreatedAt,
		},
		Stats: StatsDTO{
			PostCount:      0,
			FollowerCount:  followerCount,
			FollowingCount: followingCount,
		},
		SocialLinks:   socialLinks,
		Badges:        badges,
		Achievements:  achievements,
		ViewerContext: ctx,
	}

	return dto
}

// mapToPrivateProfileDTO adalah mapper BARU untuk profil privat
func (s *userService) mapToPrivateProfileDTO(user *models.User) *ProfileResponseDTO {
	// Hanya kembalikan data minimal yang aman untuk ditampilkan
	return &ProfileResponseDTO{
		PublicID: user.PublicID.String(),
		Username: user.Username,
        IsPrivate: true, // Beri tahu frontend ini profil privat
		Profile: ProfileInfoDTO{
			DisplayName: user.Profile.DisplayName,
			AvatarURL:   user.Profile.AvatarUrl,
			Bio:         user.Profile.Bio,
            // Sembunyikan Gender dan Location
		},
		// Kosongkan stats, social links, badges, dan achievements
		Stats:        StatsDTO{},
		SocialLinks:  make([]SocialLinkDTO, 0),
		Badges:       make([]BadgeDTO, 0),
		Achievements: make([]AchievementDTO, 0),
        // Tidak ada viewerContext karena data utama sudah disembunyikan
	}
}

func (s *userService) FollowUser(sourceUserID uint, targetUsername string) error {
	// 1. Cari user target berdasarkan username
	targetUser, err := s.userRepo.FindByUsername(targetUsername)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user to follow not found") // Error yang lebih deskriptif
		}
		return err // Error database lainnya
	}

	// 2. Validasi Logika Bisnis
	if sourceUserID == targetUser.UserID {
		return errors.New("cannot follow yourself")
	}

	// 3. Panggil repository untuk melakukan aksi
	return s.userRepo.FollowUser(sourceUserID, targetUser.UserID)
}

func (s *userService) UnfollowUser(sourceUserID uint, targetUsername string) error {
	// 1. Cari user target
	targetUser, err := s.userRepo.FindByUsername(targetUsername)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user to unfollow not found")
		}
		return err
	}

	// 2. Validasi (tidak perlu cek unfollow diri sendiri, karena follow diri sendiri sudah dicegah)

	// 3. Panggil repository
	err = s.userRepo.UnfollowUser(sourceUserID, targetUser.UserID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Jika repo mengembalikan not found, artinya relasinya memang tidak ada.
		// Ini bukan error, jadi kita return nil.
		return nil
	}
	
	return err
}

func (s *userService) UpdateProfile(userID uint, req *UpdateProfileRequestDTO, avatarFile *multipart.FileHeader) (*ProfileInfoDTO, error) {
	// 1. Upload avatar baru jika ada, di luar transaksi.
	// Kita lakukan ini di awal agar jika upload gagal, kita tidak perlu memulai transaksi DB.
	var avatarURL string
	if avatarFile != nil {
		url, err := utils.UploadToCloudinary(avatarFile, "bebu/avatars")
		if err != nil {
			return nil, fmt.Errorf("failed to upload avatar: %w", err)
		}
		avatarURL = url
	}

	// 2. Mulai Transaksi Database
	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, tx.Error // Gagal memulai transaksi
	}
	// Defer a rollback. Jika ada panic, transaksi akan dibatalkan.
	// Jika sukses (commit), rollback tidak akan berpengaruh.
	defer tx.Rollback()

	// 3. Siapkan dan jalankan update untuk UserProfile
	profileUpdates := make(map[string]interface{})
	if req.DisplayName != nil {
		profileUpdates["display_name"] = *req.DisplayName
	}
	if req.Bio != nil {
		profileUpdates["bio"] = *req.Bio
	}
	if req.Location != nil {
		profileUpdates["location"] = *req.Location
	}
	if req.Gender != nil { // <-- TAMBAHKAN BLOK INI
		profileUpdates["gender"] = *req.Gender
	}
	if avatarURL != "" { // Hanya update URL jika upload berhasil
		profileUpdates["avatar_url"] = avatarURL
	}
	
	if len(profileUpdates) > 0 {
		// Panggil repository DENGAN transaksi
		if err := s.userRepo.WithTx(tx).UpdateProfile(userID, profileUpdates); err != nil {
			// tx.Rollback() sudah di-defer, jadi kita cukup return error
			return nil, fmt.Errorf("failed to update profile: %w", err)
		}
	}

	// 4. Siapkan dan jalankan update untuk UserSettings
	settingsUpdates := make(map[string]interface{})
	if req.IsProfilePublic != nil {
		settingsUpdates["is_profile_public"] = *req.IsProfilePublic
	}
	if req.AllowDmFromPublic != nil {
		settingsUpdates["allow_dm_from_public"] = *req.AllowDmFromPublic
	}

	if len(settingsUpdates) > 0 {
		if err := s.userRepo.WithTx(tx).UpdateSettings(userID, settingsUpdates); err != nil {
			return nil, fmt.Errorf("failed to update settings: %w", err)
		}
	}
	
	// 5. Siapkan dan jalankan update untuk Social Links (jika ada di request)
	if req.SocialLinks != nil {
		var links []models.UserSocialLink
		for _, sl := range req.SocialLinks {
			// Validasi dasar bisa ditambahkan di sini jika perlu
			links = append(links, models.UserSocialLink{
				// UserID akan di-set di repository, tapi kita set di sini juga untuk kejelasan
				UserID:     userID,
				PlatformID: sl.PlatformID,
				SocialURL:  sl.URL,
			})
		}
		if err := s.userRepo.WithTx(tx).UpdateSocialLinks(userID, links); err != nil {
			return nil, fmt.Errorf("failed to update social links: %w", err)
		}
	}
	
	// 6. Jika semua operasi di dalam transaksi berhasil, Commit.
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("transaction commit failed: %w", err)
	}

	// 7. Ambil data profil terbaru untuk dikembalikan sebagai response
	// Kita butuh method FindUserByID yang sudah preload Profile
	updatedUser, err := s.userRepo.FindUserByID(userID)
	if err != nil {
		// Meskipun update berhasil, kita mungkin gagal mengambil data baru.
		// Ini jarang terjadi, tapi baik untuk ditangani.
		return nil, fmt.Errorf("update successful, but failed to fetch updated profile: %w", err)
	}
	
	// Mapping ke DTO
	return &ProfileInfoDTO{
		DisplayName: updatedUser.Profile.DisplayName,
		AvatarURL:   updatedUser.Profile.AvatarUrl,
		Bio:         updatedUser.Profile.Bio,
		Location:    updatedUser.Profile.Location,
		JoinedAt:    updatedUser.CreatedAt, // JoinedAt tidak berubah
	}, nil
}