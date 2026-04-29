package dto

import (
	"time"
)

// ProfileResponseDTO adalah struktur data utama dan lengkap yang akan dikirim sebagai response JSON.
// Ini adalah "paket" data yang merangkum semua informasi yang dibutuhkan oleh halaman profil frontend.
type ProfileResponseDTO struct {
	PublicID      string           `json:"publicId"`
	Username      string           `json:"username"`
	Profile       ProfileInfoDTO   `json:"profile"`
	Stats         StatsDTO         `json:"stats"`
	SocialLinks   []SocialLinkDTO  `json:"socialLinks"`
	Badges        []BadgeDTO       `json:"badges"`
	Achievements  []AchievementDTO `json:"achievements"`
	ViewerContext *ViewerContextDTO `json:"viewerContext,omitempty"` // omitempty: field ini tidak akan muncul di JSON jika nilainya nil (misal, user tidak login)
	IsPrivate 	  bool 				`json:"isPrivate"`
}

// ProfileInfoDTO berisi data spesifik dari tabel user_profiles.
type ProfileInfoDTO struct {
	DisplayName string    `json:"displayName"`
	AvatarURL   string    `json:"avatarUrl"`
	Bio         string    `json:"bio"`
	Location    string    `json:"location"`
	Gender      string    `json:"gender"`
	JoinedAt    time.Time `json:"joinedAt"` // Menggunakan CreatedAt dari model User
}

// StatsDTO berisi data agregat (count) yang dihitung.
// Data ini didenormalisasi untuk performa agar frontend tidak perlu menghitungnya.
type StatsDTO struct {
	PostCount      int64 `json:"postCount"`      // Didapat dari tabel posts
	FollowerCount  int64 `json:"followerCount"`  // Dihitung dari tabel user_follows
	FollowingCount int64 `json:"followingCount"` // Dihitung dari tabel user_follows
}

// SocialLinkDTO merepresentasikan satu link sosial milik user.
// Ini adalah gabungan data dari user_social_links dan platforms.
type SocialLinkDTO struct {
	PlatformName     string `json:"platformName"`
	PlatformImageUrl string `json:"platformImageUrl"`
	URL              string `json:"url"`
}

// BadgeDTO merepresentasikan satu badge yang telah diperoleh user.
// Ini adalah gabungan data dari user_badges dan badges.
type BadgeDTO struct {
	BadgeName   string `json:"badgeName"`
	LogoURL     string `json:"logoUrl"`
	Description string `json:"description"`
}

// AchievementDTO merepresentasikan satu achievement yang telah diperoleh user.
// Ini adalah gabungan data dari user_achievements dan achievements.
type AchievementDTO struct {
	AchievementName string    `json:"achievementName"`
	LogoURL         string    `json:"logoUrl"`
	Description     string    `json:"description"`
	EarnedAt        time.Time `json:"earnedAt"`
}

// ViewerContextDTO berisi informasi kontekstual dari perspektif user yang sedang login (viewer).
// Ini membantu frontend untuk menampilkan tombol yang tepat (e.g., "Follow" vs "Unfollow", "Edit Profile").
type ViewerContextDTO struct {
	IsFollowing  bool `json:"isFollowing"`  // Apakah viewer mengikuti user profil ini?
	IsPending    bool `json:"isPending"`
	IsBlocked     bool `json:"isBlocked"` // Ini berarti: Apakah target memblokir SAYA?
    IsBlockedByYou bool `json:"isBlockedByYou"` // Ini berarti: Apakah SAYA memblokir target?
	IsOwnProfile bool `json:"isOwnProfile"` // Apakah ini profil milik viewer sendiri?
}

type UpdateProfileRequestDTO struct {
	DisplayName       *string // Pointer agar bisa bedakan antara "" (string kosong) dan tidak di-supply
	Bio               *string
	Location          *string
	Gender            *string
	SocialLinks       []SocialLinkInputDTO // Menerima array social links
	IsProfilePublic   *bool // Pointer agar bisa diabaikan jika tidak di-supply
	AllowDmFromPublic *bool
}

type SocialLinkInputDTO struct {
	PlatformID uint   `json:"platformId"` // Kita pakai ID integer platform
	URL        string `json:"url"`
}

type FollowRequestDTO struct {
    Username    string `json:"username"`
    DisplayName string `json:"displayName"`
    AvatarURL   string `json:"avatarUrl"`
}