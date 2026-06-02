package utils

import (
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"errors"

	"gorm.io/gorm"
)

func HasProfileAccess(userRepo repositories.UserRepository, viewerID *uint, targetUsername string) (*models.User, bool, error) {
	// 1. Cari user target
	targetUser, err := userRepo.FindByUsername(targetUsername)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, false, nil // User tidak ada, otomatis tidak ada akses
		}
		return nil, false, err // Error database betulan
	}

	// 2. Cek Blokir & Kepemilikan (hanya jika viewer sedang login)
	if viewerID != nil {
		isOwnProfile := (*viewerID == targetUser.UserID)
		if isOwnProfile {
			return targetUser, true, nil // Pemilik selalu boleh
		}

		// Cek apakah target memblokir viewer
		isBlocked, err := userRepo.IsBlocked(targetUser.UserID, *viewerID)
		if err != nil {
			return nil, false, err
		}
		if isBlocked {
			return nil, false, nil // Diblokir = tidak ada akses
		}
	}

	// 3. Cek Status Akun (Public vs Private)
	isProfilePublic := true 
	
	if targetUser.Settings != nil { 
		isProfilePublic = targetUser.Settings.IsProfilePublic
	}

	// 4. Jika Akun Private, Cek Status Follow
	if viewerID != nil {
		followStatus, err := userRepo.GetFollowStatus(*viewerID, targetUser.UserID)
		if err != nil {
			return nil, false, err
		}
		if followStatus == "accepted" {
			return targetUser, true, nil // Follower yang diterima boleh lihat
		}
	}
	if isProfilePublic {
		return targetUser, true, nil
	}

	// Jika sampai sini, berarti viewer tidak punya akses ke data lengkap
	return targetUser, false, nil
}