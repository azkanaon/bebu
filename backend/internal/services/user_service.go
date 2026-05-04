package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"backend-bebu/pkg/utils"
	"context"
	"errors"
	"fmt"
	"log"
	"mime/multipart"

	"golang.org/x/sync/errgroup" // Untuk menjalankan query concurrent
	"gorm.io/gorm"
)


type UserService interface {
	GetProfileByUsername(username string, viewerID *uint) (*dto.ProfileResponseDTO, error)
	FollowUser(sourceUserID uint, targetUsername string) (string, error)
	UnfollowUser(sourceUserID uint, targetUsername string) error
	UpdateProfile(userID uint, req *dto.UpdateProfileRequestDTO, avatarFile *multipart.FileHeader) (*dto.ProfileInfoDTO, error)
	GetFollowRequests(userID uint) ([]dto.FollowRequestDTO, error)
	AcceptFollowRequest(currentUserID uint, requesterUsername string) error
	DeclineFollowRequest(currentUserID uint, requesterUsername string) error
	BlockUser(sourceUserID uint, targetUsername string) error
	UnblockUser(sourceUserID uint, targetUsername string) error
	GetMyProfile(id uint) (*models.User, error)
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

func (s *userService) GetProfileByUsername(username string, viewerID *uint) (*dto.ProfileResponseDTO, error) {
	// 1. Dapatkan data user utama
	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		return nil, err
	}

	// --- LOGIKA BLOKIR ASIMETRIS BARU ---
	var isBlockedByTarget, isBlockedByViewer, isOwnProfile bool
	if viewerID != nil {
		isOwnProfile = (*viewerID == user.UserID)
		if !isOwnProfile {
			// Cek blokir hanya jika bukan profil sendiri
			g, _ := errgroup.WithContext(context.Background())
			g.Go(func() error {
				var errCheck error; isBlockedByTarget, errCheck = s.userRepo.IsBlocked(user.UserID, *viewerID); return errCheck
			})
			g.Go(func() error {
				var errCheck error; isBlockedByViewer, errCheck = s.userRepo.IsBlocked(*viewerID, user.UserID); return errCheck
			})
			if err := g.Wait(); err != nil { return nil, err }
		}
	}

	// 3. Terapkan aturan akses utama
	if isBlockedByTarget {
		return nil, gorm.ErrRecordNotFound // Jika saya diblokir, akses ditolak sepenuhnya.
	}

	
	var followerCount, followingCount int64
	
	g, _ := errgroup.WithContext(context.Background())

	// Hitung jumlah follower (yang statusnya 'accepted')
	g.Go(func() error {
		var errCount error
		// Note: Kita mungkin perlu memodifikasi GetFollowerCount agar hanya menghitung yg 'accepted'
		followerCount, errCount = s.userRepo.GetFollowerCount(user.UserID)
		return errCount
	})

	// Hitung jumlah following (yang statusnya 'accepted')
	g.Go(func() error {
		var errCount error
		followingCount, errCount = s.userRepo.GetFollowingCount(user.UserID)
		return errCount
	})
	
	// (Jika sudah ada, hitung jumlah post)
	// g.Go(func() error { ... })

	if err := g.Wait(); err != nil {
		return nil, err
	}


	// 2. Siapkan viewerContext jika ada viewer.
	var viewerContext *dto.ViewerContextDTO
	var followStatus string = "not_following"
	if viewerID != nil {
		isOwnProfile := (*viewerID == user.UserID)
		g, _ := errgroup.WithContext(context.Background())
		// Ambil status follow
		g.Go(func() error {
			var errStatus error
			// Kita tidak perlu memanggil repo lagi jika sudah punya status dari pengecekan akses di atas
			// Tapi untuk membuat blok ini mandiri, kita panggil lagi. Ini lebih bersih.
			followStatus, errStatus = s.userRepo.GetFollowStatus(*viewerID, user.UserID)
			return errStatus
		})

		if err := g.Wait(); err != nil {
			return nil, err
		}

		// Buat DTO viewerContext dengan semua data yang sudah terkumpul.
		// Pastikan DTO ViewerContextDTO sudah diupdate dengan field IsPending.
		viewerContext = &dto.ViewerContextDTO{
			IsFollowing:  (followStatus == "accepted"),
			IsPending:    (followStatus == "pending"),
			IsBlocked:      isBlockedByTarget, // Sudah kita hitung di atas
			IsBlockedByYou: isBlockedByViewer, // Sudah kita hitung di atas
			IsOwnProfile: isOwnProfile,
		}
	}

	// 5. Tentukan apakah viewer punya akses ke konten LENGKAP
	var hasFullAccess bool
	isProfilePublic := (user.Settings == nil || user.Settings.IsProfilePublic)

	if isProfilePublic || isOwnProfile || (followStatus == "accepted") {
		hasFullAccess = true
	}

	// 6. Buat response berdasarkan akses
	if !hasFullAccess {
		// Jika tidak punya akses penuh (karena profil privat dan belum di-follow),
		// kembalikan data terbatas TAPI DENGAN viewerContext.
		return s.mapToPrivateProfileDTO(user, viewerContext), nil
	}
	
	// 3. Panggil mapper untuk merakit response akhir.
	response := s.mapToPublicProfileDTO(user, followerCount, followingCount, viewerContext)
	return response, nil
}

func (s *userService) mapToPublicProfileDTO(
	user *models.User,
	followerCount, followingCount int64,
	ctx *dto.ViewerContextDTO,
) *dto.ProfileResponseDTO {

	// 1. Mapping Social Links
	socialLinks := make([]dto.SocialLinkDTO, len(user.SocialLinks))
	for i, link := range user.SocialLinks {
		dto := dto.SocialLinkDTO{
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
	badges := make([]dto.BadgeDTO, len(user.Badges))
	for i, badge := range user.Badges {
		dto := dto.BadgeDTO{
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
	achievements := make([]dto.AchievementDTO, len(user.UserAchievements))
    for i, ua := range user.UserAchievements {
		dto := dto.AchievementDTO{
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
	dto := &dto.ProfileResponseDTO{
		PublicID: user.PublicID.String(),
		Username: user.Username,
		Profile: dto.ProfileInfoDTO{
			DisplayName: user.Profile.DisplayName,
			AvatarURL:   user.Profile.AvatarUrl,
			Bio:         user.Profile.Bio,
			Location:    user.Profile.Location,
			JoinedAt:    user.CreatedAt,
		},
		Stats: dto.StatsDTO{
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
func (s *userService) mapToPrivateProfileDTO(user *models.User,  viewerContext *dto.ViewerContextDTO) *dto.ProfileResponseDTO {
	// Hanya kembalikan data minimal yang aman untuk ditampilkan
	return &dto.ProfileResponseDTO{
		PublicID: user.PublicID.String(),
		Username: user.Username,
        IsPrivate: true, // Beri tahu frontend ini profil privat
		Profile: dto.ProfileInfoDTO{
			DisplayName: user.Profile.DisplayName,
			AvatarURL:   user.Profile.AvatarUrl,
			Bio:         user.Profile.Bio,
            // Sembunyikan Gender dan Location
		},
		// Kosongkan stats, social links, badges, dan achievements
		Stats:        dto.StatsDTO{},
		SocialLinks:  make([]dto.SocialLinkDTO, 0),
		Badges:       make([]dto.BadgeDTO, 0),
		Achievements: make([]dto.AchievementDTO, 0),
		ViewerContext: viewerContext,
	}
}

func (s *userService) FollowUser(sourceUserID uint, targetUsername string) (string, error) {
	// 1. Cari user target
	targetUser, err := s.userRepo.FindByUsername(targetUsername)
	if err != nil { /* ... */ }

	// 2. Validasi
	if sourceUserID == targetUser.UserID { /* ... */ }

	// Cek blokir dari target (di luar transaksi)
	isBlockedByTarget, err := s.userRepo.IsBlocked(targetUser.UserID, sourceUserID)
	if err != nil { return "", err }
	if isBlockedByTarget { return "", errors.New("user to follow not found") }

	// 3. Mulai Transaksi
	tx := s.db.Begin()
	if tx.Error != nil { return "", tx.Error }
	defer tx.Rollback()

	// Buat repo yang terikat transaksi
	txRepo := s.userRepo.WithTx(tx)

	// 4. Lakukan SEMUA operasi tulis menggunakan txRepo
	isBlockedBySource, err := txRepo.IsBlocked(sourceUserID, targetUser.UserID)
	if err != nil { return "", err }

	if isBlockedBySource {
		if err := txRepo.UnblockUser(sourceUserID, targetUser.UserID); err != nil {
			return "", err
		}
	}

	// 5. Tentukan status follow
	var followStatus string
    isPrivate := targetUser.Settings != nil && !targetUser.Settings.IsProfilePublic
	if isPrivate {
		followStatus = "pending"
	} else {
		followStatus = "accepted"
	}

	// --- PERBAIKAN KRUSIAL DI SINI ---
	// Gunakan txRepo, bukan s.userRepo
	finalStatus, err := txRepo.FollowUser(sourceUserID, targetUser.UserID, followStatus)
    if err != nil {
        return "", err
    }

	 if finalStatus == "accepted" {
        // Gunakan errgroup untuk update stats kedua user secara concurrent.
        g, _ := errgroup.WithContext(context.Background())

        // Tambah +1 ke 'total_following' untuk user yang me-follow (source).
        g.Go(func() error {
            return s.userRepo.UpdateUserStat(sourceUserID, "total_following", 1)
        })

        // Tambah +1 ke 'total_followers' untuk user yang di-follow (target).
        g.Go(func() error {
            return s.userRepo.UpdateUserStat(targetUser.UserID, "total_followers", 1)
        })
        
        if err := g.Wait(); err != nil {
            // Log error ini, tapi jangan gagalkan seluruh operasi follow.
            // Update stats adalah optimasi, bukan bagian krusial dari aksi.
            log.Printf("WARNING: Failed to update user stats after follow: %v", err)
        }
    }

	return finalStatus, nil
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
	currentStatus, err := s.userRepo.GetFollowStatus(sourceUserID, targetUser.UserID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	
	// Lakukan aksi unfollow (menghapus baris)
	if err := s.userRepo.UnfollowUser(sourceUserID, targetUser.UserID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil // Bukan error jika memang tidak follow
		}
		return err
	}
	
	 if currentStatus == "accepted" {
        g, _ := errgroup.WithContext(context.Background())

        // Kurangi -1 dari 'total_following' untuk user yang unfollow (source).
        g.Go(func() error {
            return s.userRepo.UpdateUserStat(sourceUserID, "total_following", -1)
        })

        // Kurangi -1 dari 'total_followers' untuk user yang di-unfollow (target).
        g.Go(func() error {
            return s.userRepo.UpdateUserStat(targetUser.UserID, "total_followers", -1)
        })

        if err := g.Wait(); err != nil {
            log.Printf("WARNING: Failed to update user stats after unfollow: %v", err)
        }
    }
	
	return nil
}

func (s *userService) UpdateProfile(userID uint, req *dto.UpdateProfileRequestDTO, avatarFile *multipart.FileHeader) (*dto.ProfileInfoDTO, error) {
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
	return &dto.ProfileInfoDTO{
		DisplayName: updatedUser.Profile.DisplayName,
		AvatarURL:   updatedUser.Profile.AvatarUrl,
		Bio:         updatedUser.Profile.Bio,
		Location:    updatedUser.Profile.Location,
		JoinedAt:    updatedUser.CreatedAt, // JoinedAt tidak berubah
	}, nil
}

func (s *userService) GetFollowRequests(userID uint) ([]dto.FollowRequestDTO, error) {
	requests, err := s.userRepo.GetPendingFollowRequests(userID)
	if err != nil {
		return nil, err
	}
	
	// Mapping dari model ke DTO
	var responseDTOs []dto.FollowRequestDTO
	for _, req := range requests {
		responseDTOs = append(responseDTOs, dto.FollowRequestDTO{
			Username:    req.UserFollowing.Username,
			DisplayName: req.UserFollowing.Profile.DisplayName,
			AvatarURL:   req.UserFollowing.Profile.AvatarUrl,
		})
	}
	
	return responseDTOs, nil
}

func (s *userService) AcceptFollowRequest(currentUserID uint, requesterUsername string) error {
	// 1. Cari user yang mengirim request
	requester, err := s.userRepo.FindByUsername(requesterUsername)
	if err != nil {
		return errors.New("requester not found")
	}
	
	// 2. Panggil repo untuk update status dari 'pending' ke 'accepted'
	// source = requester, target = currentUser
	err = s.userRepo.UpdateFollowStatus(requester.UserID, currentUserID, "accepted")
    if err != nil { /* ... */ }

    // --- UPDATE STATS DI SINI ---
    g, _ := errgroup.WithContext(context.Background())
    // Tambah +1 ke 'total_following' untuk requester.
    g.Go(func() error {
        return s.userRepo.UpdateUserStat(requester.UserID, "total_following", 1)
    })
    // Tambah +1 ke 'total_followers' untuk user saat ini.
    g.Go(func() error {
        return s.userRepo.UpdateUserStat(currentUserID, "total_followers", 1)
    })
    if err := g.Wait(); err != nil {
        log.Printf("WARNING: Failed to update user stats after accepting follow: %v", err)
    }

    return nil
}

func (s *userService) DeclineFollowRequest(currentUserID uint, requesterUsername string) error {
	// 1. Cari user yang mengirim request
	requester, err := s.userRepo.FindByUsername(requesterUsername)
	if err != nil {
		return errors.New("requester not found")
	}

	// 2. Panggil repo untuk menghapus baris permintaan
	// source = requester, target = currentUser
	return s.userRepo.DeleteFollowRequest(requester.UserID, currentUserID)
}

func (s *userService) BlockUser(sourceUserID uint, targetUsername string) error {
	// 1. Cari user target
	targetUser, err := s.userRepo.FindByUsername(targetUsername)
	if err != nil {
		return errors.New("user to block not found")
	}

	// 2. Validasi: tidak bisa blokir diri sendiri
	if sourceUserID == targetUser.UserID {
		return errors.New("cannot block yourself")
	}

	// 3. Mulai Transaksi
	tx := s.db.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer tx.Rollback() // Rollback jika ada panic atau error

	// Buat instance repo yang menggunakan transaksi
	txRepo := s.userRepo.WithTx(tx)

	// 4. Hapus semua relasi follow antara kedua user (dua arah)
	// A unfollow B
	if err := txRepo.UnfollowUser(sourceUserID, targetUser.UserID); err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	// B unfollow A
	if err := txRepo.UnfollowUser(targetUser.UserID, sourceUserID); err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	// 5. Buat entri blokir
	if err := txRepo.BlockUser(sourceUserID, targetUser.UserID); err != nil {
		return err
	}
	
	// 6. Jika semua berhasil, commit transaksi
	return tx.Commit().Error
}

func (s *userService) UnblockUser(sourceUserID uint, targetUsername string) error {
	// 1. Cari user target
	targetUser, err := s.userRepo.FindByUsername(targetUsername)
	if err != nil {
		return errors.New("user to unblock not found")
	}

	// 2. Panggil repo untuk menghapus relasi blokir
	return s.userRepo.UnblockUser(sourceUserID, targetUser.UserID)
}

func (s *userService) GetMyProfile(id uint) (*models.User, error) {
    user, err := s.userRepo.FindUserByID(id)
    if err != nil {
        return nil, err
    }
    
    // Kamu bisa mengosongkan password sebelum dikirim ke handler
    user.PasswordHash = "" 
    return user, nil
}