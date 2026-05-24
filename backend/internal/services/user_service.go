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
	GetFollowRequests(userID uint, page, limit int) ([]dto.FollowRequestDTO, *dto.PaginationDTO, error)
	AcceptFollowRequest(currentUserID uint, requesterUsername string) error
	DeclineFollowRequest(currentUserID uint, requesterUsername string) error
	BlockUser(sourceUserID uint, targetUsername string) error
	UnblockUser(sourceUserID uint, targetUsername string) error
	GetMyProfile(id uint) (*models.User, error)
	SearchUsers(query string, currentUserID uint) ([]dto.UserSearchResponse, error)

	GetFollowerList(viewerID *uint, targetUsername string, page, limit int) ([]dto.UserSummaryDTO, *dto.PaginationDTO, error)
	GetFollowingList(viewerID *uint, targetUsername string, page, limit int) ([]dto.UserSummaryDTO, *dto.PaginationDTO, error)
}

type userService struct {
	db       *gorm.DB
	userRepo repositories.UserRepository
	notifService NotificationService
}

func NewUserService(db *gorm.DB, userRepo repositories.UserRepository, nService NotificationService) UserService { // <-- TERIMA DB
	return &userService{
		db:       db, // <-- SIMPAN DB
		userRepo: userRepo,
		notifService: nService,
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

	actualIsPrivateAccount := false
	if user.Settings != nil {
		actualIsPrivateAccount = !user.Settings.IsProfilePublic
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

	stats, err := s.userRepo.GetUserStats(user.UserID)
    if err != nil {
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
		return s.mapToPrivateProfileDTO(user, stats,actualIsPrivateAccount, viewerContext), nil
	}
	
	// 3. Panggil mapper untuk merakit response akhir.
	response := s.mapToPublicProfileDTO(user, stats,actualIsPrivateAccount, viewerContext)
	return response, nil
}

func (s *userService) mapToPublicProfileDTO(
	user *models.User,
	stats *models.UserStat,
	isPrivateAcc bool,
	ctx *dto.ViewerContextDTO,
) *dto.ProfileResponseDTO {

	// 1. Mapping Social Links
	socialLinks := make([]dto.SocialLinkDTO, len(user.SocialLinks))
	for i, link := range user.SocialLinks {
		dto := dto.SocialLinkDTO{
			PlatformName: link.Platform.PlatformName,
			URL:          link.SocialURL,
			PlatformSlug: link.Platform.Slug,
		}
		socialLinks[i] = dto
	}

	// 2. Mapping Badges
	favBadges := make([]dto.BadgeDTO, 0, len(user.FavoriteUserBadges))
    for _, ub := range user.FavoriteUserBadges {
        favBadges = append(favBadges, dto.BadgeDTO{
			BadgeID:     ub.BadgeID,
            BadgeName:   ub.Badge.BadgeName,
            LogoURL:     *ub.Badge.LogoURL,
            Description: *ub.Badge.Description,
			DisplayOrder: ub.DisplayOrder,
        })
    }
    
    // Mapping Favorite Achievements
    favAchievements := make([]dto.AchievementDTO, 0, len(user.FavoriteUserAchievements))
    for _, ua := range user.FavoriteUserAchievements {
        favAchievements = append(favAchievements, dto.AchievementDTO{
            AchievementID: ua.AchievementID,
            AchievementName: ua.Achievement.AchievementName,
            LogoURL:         *ua.Achievement.LogoURL,
            Description:     *ua.Achievement.Description,
			DisplayOrder: ua.DisplayOrder,
            EarnedAt:        ua.EarnedAt,
        })
    }

	// 4. Merakit DTO utama
	dto := &dto.ProfileResponseDTO{
		PublicID: user.PublicID.String(),
		Username: user.Username,
		IsPrivateAccount: isPrivateAcc,
		Settings: &dto.UserSettingsDTO{
			IsProfilePublic: user.Settings != nil && user.Settings.IsProfilePublic,
			AllowDmFromPublic: user.Settings != nil && user.Settings.AllowDmFromPublic,
		},
		Profile: dto.ProfileInfoDTO{
			DisplayName: user.Profile.DisplayName,
			AvatarURL:   user.Profile.AvatarUrl,
			Bio:         user.Profile.Bio,
			Gender:      user.Profile.Gender,
			Location:    user.Profile.Location,
			JoinedAt:    user.CreatedAt,
		},
		Stats: dto.UserStatsDTO{
			TotalFollowers:  stats.TotalFollowers,
            TotalFollowing:  stats.TotalFollowing,
            TotalPosts:      stats.TotalPosts,
			TotalBadges:           stats.TotalBadges,
        	TotalAchievements:     stats.TotalAchievements,
		},
		SocialLinks:   socialLinks,
		FavoriteBadges:        favBadges,
		FavoriteAchievements:  favAchievements,
		ViewerContext: ctx,
	}

	return dto
}

// mapToPrivateProfileDTO adalah mapper BARU untuk profil privat
func (s *userService) mapToPrivateProfileDTO(user *models.User, stats *models.UserStat, isPrivateAccount bool,  viewerContext *dto.ViewerContextDTO) *dto.ProfileResponseDTO {
	// 1. Mapping Social Links
	socialLinks := make([]dto.SocialLinkDTO, len(user.SocialLinks))
	for i, link := range user.SocialLinks {
		dto := dto.SocialLinkDTO{
			PlatformName: link.Platform.PlatformName,
			URL:          link.SocialURL,
			PlatformSlug: link.Platform.Slug,
		}
		socialLinks[i] = dto
	}

	// 4. Merakit DTO utama
	dto := &dto.ProfileResponseDTO{
		PublicID: user.PublicID.String(),
		Username: user.Username,
        IsPrivate: true,
		IsPrivateAccount: isPrivateAccount,
		Profile: dto.ProfileInfoDTO{
			DisplayName: user.Profile.DisplayName,
			AvatarURL:   user.Profile.AvatarUrl,
			Bio:         user.Profile.Bio,
			Gender:      user.Profile.Gender,
			Location:    user.Profile.Location,
			JoinedAt:    user.CreatedAt,
		},
		Stats: dto.UserStatsDTO{
			TotalFollowers:  stats.TotalFollowers,
            TotalFollowing:  stats.TotalFollowing,
            TotalPosts:      stats.TotalPosts,
			TotalBadges:           0,
        	TotalAchievements:     0,

		},
		Settings: &dto.UserSettingsDTO{
			IsProfilePublic: user.Settings != nil && user.Settings.IsProfilePublic,
			AllowDmFromPublic: user.Settings != nil && user.Settings.AllowDmFromPublic,
		},
		SocialLinks:   socialLinks,
		FavoriteBadges:        []dto.BadgeDTO{},
		FavoriteAchievements:  []dto.AchievementDTO{},
		ViewerContext: viewerContext,
	}
	return dto
}

func (s *userService) FollowUser(sourceUserID uint, targetUsername string) (string, error) {
	// 1. Cari user target
	targetUser, err := s.userRepo.FindByUsername(targetUsername)
	if err != nil {
		return "", fmt.Errorf("target user not found: %w", err)
	}

	if sourceUserID == targetUser.UserID {
		return "", errors.New("you cannot perform this action on yourself")
	}

	// Cek blokir dari target (di luar transaksi)
	isBlockedByTarget, err := s.userRepo.IsBlocked(targetUser.UserID, sourceUserID)
	if err != nil { return "", err }
	if isBlockedByTarget { return "", errors.New("user to follow not found") }

	// 2. Mulai Transaksi
	tx := s.db.Begin()
	if tx.Error != nil { return "", tx.Error }
	defer tx.Rollback()

	txRepo := s.userRepo.WithTx(tx)

	// 3. Cek & Unblock jika perlu
	isBlockedBySource, err := txRepo.IsBlocked(sourceUserID, targetUser.UserID)
	if err != nil { return "", err }

	if isBlockedBySource {
		if err := txRepo.UnblockUser(sourceUserID, targetUser.UserID); err != nil {
			return "", err
		}
	}

	// 4. Tentukan status
	isPrivate := targetUser.Settings != nil && !targetUser.Settings.IsProfilePublic
	followStatus := "accepted"
	if isPrivate { followStatus = "pending" }

	// 5. Follow User
	// Disini kita memanggil fungsi repo yang baru tadi
	finalStatus, isNew, err := txRepo.FollowUser(tx, sourceUserID, targetUser.UserID, followStatus)
	if err != nil {
		// Ini akan mengembalikan error "you already follow this user"
		log.Printf("DEBUG: Error saat memanggil FollowUser: %v", err)
		return "", err 
	}

	// 6. Update Stats (HANYA jika data benar-benar baru)
	if isNew && finalStatus == "accepted" {
		if err := txRepo.SyncUserStats(tx, sourceUserID, "total_following", 1); err != nil {
			return "", err
		}

		if err := txRepo.SyncUserStats(tx, targetUser.UserID, "total_followers", 1); err != nil {
			return "", err
		}
	}

	// 7. Commit
	if err := tx.Commit().Error; err != nil {
		return "", err
	}
	go func() {
		switch finalStatus {
		case "pending":
			s.notifService.Send(targetUser.UserID, sourceUserID, "FOLLOW_REQUEST", "users", sourceUserID)
		case "accepted":
			s.notifService.Send(targetUser.UserID, sourceUserID, "NEW_FOLLOWER", "users", sourceUserID)
		}
	}()

	return finalStatus, nil
}

func (s *userService) UnfollowUser(sourceUserID uint, targetUsername string) error {
	targetUser, err := s.userRepo.FindByUsername(targetUsername)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user to unfollow not found")
		}
		return err
	}

	// 1. Cek status sebelum unfollow (tetap di luar transaksi tidak apa-apa)
	currentStatus, err := s.userRepo.GetFollowStatus(sourceUserID, targetUser.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil // Sudah tidak follow, anggap sukses
		}
		return err
	}

	go s.notifService.Remove(targetUser.UserID, sourceUserID, "NEW_FOLLOWER", "users", sourceUserID, 1)

	// 2. Mulai Transaksi
	return s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.userRepo.WithTx(tx)

		// Lakukan unfollow
		if err := txRepo.UnfollowUser(tx, sourceUserID, targetUser.UserID); err != nil {
			return err
		}

		// Jika sebelumnya 'accepted', kurangi stats
		if currentStatus == "accepted" {
			// Kurangi 'total_following' source
			if err := txRepo.SyncUserStats(tx, sourceUserID, "total_following", -1); err != nil {
				return err
			}
			// Kurangi 'total_followers' target
			if err := txRepo.SyncUserStats(tx, targetUser.UserID, "total_followers", -1); err != nil {
				return err
			}
		}

		return nil
	})
	
}

func (s *userService) UpdateProfile(userID uint, req *dto.UpdateProfileRequestDTO, avatarFile *multipart.FileHeader) (*dto.ProfileInfoDTO, error) {
	// 1. Upload avatar baru jika ada, di luar transaksi.
	var avatarURL string
    var shouldUpdateAvatar bool // Flag untuk menandai apakah kolom avatar harus diupdate

    // 1. Logika Prioritas Foto:
    // Kondisi A: User mengunggah file baru
    if avatarFile != nil {
        url, err := utils.UploadToCloudinary(avatarFile, "bebu/avatars")
        if err != nil {
            return nil, fmt.Errorf("failed to upload avatar: %w", err)
        }
        avatarURL = url
        shouldUpdateAvatar = true
    } else if req.RemoveAvatar != nil && *req.RemoveAvatar == true {
        // Kondisi B: User tidak upload file, tapi centang "Hapus Foto"
        avatarURL = "" // Set ke string kosong di database (kembali ke default)
        shouldUpdateAvatar = true
    }
	currentUser, err := s.userRepo.FindUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch current user data: %w", err)
	}
	// 2. Mulai Transaksi Database
	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, tx.Error // Gagal memulai transaksi
	}
	// Defer a rollback. Jika ada panic, transaksi akan dibatalkan.
	// Jika sukses (commit), rollback tidak akan berpengaruh.
	defer tx.Rollback()
	txRepo := s.userRepo.WithTx(tx) 
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
	if shouldUpdateAvatar {
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
		
		// Gunakan pengecekan yang aman
		var currentIsPublic bool
		if currentUser.Settings != nil {
			currentIsPublic = currentUser.Settings.IsProfilePublic
		}

		// LOGIKA: Status baru TRUE (Public) DAN Status lama FALSE (Private)
		isTurningPublic := *req.IsProfilePublic == true && currentIsPublic == false
		
		settingsUpdates["is_profile_public"] = *req.IsProfilePublic
		
		if isTurningPublic {
			// Jalankan proses auto-accept
			followerIDs, err := txRepo.GetPendingFollowerIDs(userID)
			if err == nil && len(followerIDs) > 0 {
				// Gunakan handle transaksi (txRepo dan tx) secara konsisten
				_, _ = txRepo.AcceptAllPendingFollows(userID)
				_ = txRepo.SyncUserStats(tx, userID, "total_followers", len(followerIDs))
				_ = txRepo.BulkUpdateUserStat(tx, followerIDs, "total_following", 1)
			}
		}
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
		Gender:      updatedUser.Profile.Gender,
		JoinedAt:    updatedUser.CreatedAt, // JoinedAt tidak berubah
	}, nil
}

func (s *userService) GetFollowRequests(userID uint, page, limit int) ([]dto.FollowRequestDTO, *dto.PaginationDTO, error) {
	// Ambil data dan total dari repo
	requests, total, err := s.userRepo.GetPendingFollowRequests(userID, page, limit)
	if err != nil {
		return nil, nil, err
	}
	
	// Mapping dari model ke DTO
	responseDTOs := make([]dto.FollowRequestDTO, 0, len(requests))
	for _, req := range requests {
		responseDTOs = append(responseDTOs, dto.FollowRequestDTO{
			Username:    req.UserFollowing.Username,
			DisplayName: req.UserFollowing.Profile.DisplayName,
			AvatarURL:   req.UserFollowing.Profile.AvatarUrl,
		})
	}

	// Buat metadata paginasi menggunakan helper yang sudah kita punya
	pagination := dto.NewPaginationDTO(total, page, limit)
	
	return responseDTOs, pagination, nil
}

func (s *userService) AcceptFollowRequest(currentUserID uint, requesterUsername string) error {
	requester, err := s.userRepo.FindByUsername(requesterUsername)
	if err != nil {
		return errors.New("requester not found")
	}
	
	// 1. Mulai Transaksi
	return s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.userRepo.WithTx(tx)

		// 2. Update status (gunakan tx)
		if err := txRepo.UpdateFollowStatus(tx, requester.UserID, currentUserID, "accepted"); err != nil {
			return err
		}

		// 3. Update stats (gunakan tx, hapus errgroup karena kita butuh konsistensi di dalam tx)
		// Tambah +1 ke 'total_following' untuk requester
		if err := txRepo.SyncUserStats(tx, currentUserID, "total_followers", 1); err != nil {
			return err
		}

		// 3. UPDATE STATS REQUESTER
		if err := txRepo.SyncUserStats(tx, requester.UserID, "total_following", 1); err != nil {
			return err
		}

		if err == nil {
		go func() {
			// A. Hapus notifikasi "FOLLOW_REQUEST" yang lama di HP si pemilik akun (currentUserID)
			// Agar notifikasi "Nando ingin mem-follow Anda" hilang karena sudah di-acc.
			s.notifService.Remove(currentUserID, requester.UserID, "FOLLOW_REQUEST", "users", requester.UserID, 1)

			// B. Kirim notifikasi ke si pengikut (requester) bahwa permintaannya diterima
			s.notifService.Send(requester.UserID, currentUserID, "FOLLOW_ACCEPT", "users", currentUserID)
		}()
	}


		return nil // Commit otomatis
	})
}

func (s *userService) DeclineFollowRequest(currentUserID uint, requesterUsername string) error {
	// 1. Cari user yang mengirim request
	requester, err := s.userRepo.FindByUsername(requesterUsername)
	if err != nil {
		return errors.New("requester not found")
	}

	
	go s.notifService.Remove(currentUserID, requester.UserID, "FOLLOW_REQUEST", "users", requester.UserID, 1)
	
	// 2. Panggil repo untuk menghapus baris permintaan
	// source = requester, target = currentUser
	return s.userRepo.DeleteFollowRequest(requester.UserID, currentUserID)
}

func (s *userService) BlockUser(sourceUserID uint, targetUsername string) error {
	targetUser, err := s.userRepo.FindByUsername(targetUsername)
	if err != nil {
		return errors.New("user to block not found")
	}

	if sourceUserID == targetUser.UserID {
		return errors.New("cannot block yourself")
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.userRepo.WithTx(tx)

		// --- 1. PROSES UNFOLLOW A -> B (Source block Target) ---
		statusAToB, err := txRepo.GetFollowStatus(sourceUserID, targetUser.UserID)
		if err == nil && statusAToB != "not_following" {
			// Hapus hubungan follow
			if err := txRepo.UnfollowUser(tx, sourceUserID, targetUser.UserID); err != nil {
				return err
			}
			// Update stats hanya jika sebelumnya sudah 'accepted'
			if statusAToB == "accepted" {
				// Kurangi Following A, Kurangi Follower B
				_ = txRepo.SyncUserStats(tx, sourceUserID, "total_following", -1)
				_ = txRepo.SyncUserStats(tx, targetUser.UserID, "total_followers", -1)
			}
		}

		// --- 2. PROSES UNFOLLOW B -> A (Target pernah follow Source) ---
		statusBToA, err := txRepo.GetFollowStatus(targetUser.UserID, sourceUserID)
		if err == nil && statusBToA != "not_following" {
			// Hapus hubungan follow
			if err := txRepo.UnfollowUser(tx, targetUser.UserID, sourceUserID); err != nil {
				return err
			}
			// Update stats hanya jika sebelumnya sudah 'accepted'
			if statusBToA == "accepted" {
				// Kurangi Following B, Kurangi Follower A
				_ = txRepo.SyncUserStats(tx, targetUser.UserID, "total_following", -1)
				_ = txRepo.SyncUserStats(tx, sourceUserID, "total_followers", -1)
			}
		}

		// --- 3. BUAT ENTRI BLOKIR ---
		if err := txRepo.BlockUser(tx, sourceUserID, targetUser.UserID); err != nil {
			return err
		}

		return nil
	})
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

func (s *userService) SearchUsers(query string, currentUserID uint) ([]dto.UserSearchResponse, error) {
    users, err := s.userRepo.SearchUsers(query, currentUserID, 20)
    if err != nil {
        return nil, err
    }

    var result []dto.UserSearchResponse
    for _, u := range users {
        avatar := ""
        displayName := u.Username
        
        if u.Profile != nil {
            avatar = u.Profile.AvatarUrl
            if u.Profile.DisplayName != "" {
                displayName = u.Profile.DisplayName
            }
        }

        result = append(result, dto.UserSearchResponse{
            ID:          u.UserID,
            Username:    u.Username,
            DisplayName: displayName,
            Avatar:      avatar,
        })
    }
    return result, nil
}

func (s *userService) GetFollowerList(viewerID *uint, targetUsername string, page, limit int) ([]dto.UserSummaryDTO, *dto.PaginationDTO, error) {
	// 1. Cek akses (menggunakan helper yang sudah ada di PostService, kita asumsikan helper itu ada di sini juga)
	targetUser, hasAccess, err := utils.HasProfileAccess(s.userRepo, viewerID, targetUsername)
	if err != nil || !hasAccess {
		return make([]dto.UserSummaryDTO, 0), dto.NewPaginationDTO(0, page, limit), err
	}

	// 2. Panggil repository yang sesuai
	users, total, err := s.userRepo.GetFollowers(viewerID, targetUser.UserID, page, limit)
	if err != nil {
		return nil, nil, err
	}

	// 3. Map ke DTO dan buat paginasi
	dtos, err := s.mapUsersToSummaryDTOs(viewerID, users)
	if err != nil {
		return nil, nil, err
	}
	pagination := dto.NewPaginationDTO(total, page, limit)

	return dtos, pagination, err
}


func (s *userService) GetFollowingList(viewerID *uint, targetUsername string, page, limit int) ([]dto.UserSummaryDTO, *dto.PaginationDTO, error) {
	targetUser, hasAccess, err := utils.HasProfileAccess(s.userRepo, viewerID, targetUsername)
	if err != nil || !hasAccess {
		return []dto.UserSummaryDTO{}, dto.NewPaginationDTO(0, page, limit), err
	}

	// PERUBAHAN: Sekarang kita masukkan viewerID ke parameter pertama
	users, total, err := s.userRepo.GetFollowing(viewerID, targetUser.UserID, page, limit)
	if err != nil {
		return nil, nil, err
	}

	dtos, err := s.mapUsersToSummaryDTOs(viewerID, users)
	return dtos, dto.NewPaginationDTO(total, page, limit), err
}


// --- Buat fungsi helper baru untuk mapping ---
func (s *userService) mapUsersToSummaryDTOs(viewerID *uint, users []models.User) ([]dto.UserSummaryDTO, error) {
	dtos := make([]dto.UserSummaryDTO, len(users))
	for i, user := range users {
		dtos[i] = dto.UserSummaryDTO{
			Username:    user.Username,
			DisplayName: user.Profile.DisplayName,
			AvatarURL:   user.Profile.AvatarUrl,
		}

		// Jika ada yang melihat, isi viewerContext
		if viewerID != nil {
			
			// Cek relasi follow antara viewer dan user dalam daftar ini
			// Ini bisa menyebabkan N+1 query. Untuk produksi, ini perlu dioptimalkan.
			myFollowStatus, err := s.userRepo.GetFollowStatus(*viewerID, user.UserID)
			if err != nil { return nil, err }

			// 2. Cek status hubungan orang di list ini terhadap SAYA (Viewer)
			theirFollowStatus, err := s.userRepo.GetFollowStatus(user.UserID, *viewerID)
			if err != nil { return nil, err }

			dtos[i].ViewerContext = &dto.FollowerContextDTO{
				IsFollowing:    (myFollowStatus == "accepted"),
				IsPending:    (myFollowStatus == "pending"),  // <-- SET FIELD BARU DI SINI
				IsFollowedBy:   (theirFollowStatus == "accepted"),
				IsOwnProfile: (*viewerID == user.UserID),
			}
		}
	}
	return dtos, nil
}

