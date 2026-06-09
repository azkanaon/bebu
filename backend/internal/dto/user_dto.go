package dto

import (
	"time"
)

// ProfileResponseDTO adalah struktur data utama dan lengkap yang akan dikirim sebagai response JSON.
// Ini adalah "paket" data yang merangkum semua informasi yang dibutuhkan oleh halaman profil frontend.
type ProfileResponseDTO struct {
	UserID   	  uint `json:"userId"`
	PublicID      string           `json:"publicId"`
	Username      string           `json:"username"`
	Profile       ProfileInfoDTO   `json:"profile"`
	Stats         UserStatsDTO         `json:"stats"`
	SocialLinks   []SocialLinkDTO  `json:"socialLinks"`
	FavoriteBadges        []BadgeDTO `json:"favoriteBadges"`
	FavoriteAchievements  []AchievementDTO `json:"favoriteAchievements"`
	Settings      *UserSettingsDTO `json:"settings,omitempty"` // omitempty: field ini tidak akan muncul di JSON jika nil (misal, user belum mengatur preferensi)

	ViewerContext *ViewerContextDTO `json:"viewerContext,omitempty"` // omitempty: field ini tidak akan muncul di JSON jika nilainya nil (misal, user tidak login)
	IsPrivate 	  bool 				`json:"isPrivate"`
	IsPrivateAccount bool 			`json:"isPrivateAccount"`
}

type UserSettingsDTO struct {
	IsProfilePublic   bool `json:"isProfilePublic"`
	AllowDmFromPublic bool `json:"allowDmFromPublic"`
	IsBookshelfPublic bool `json:"isBookshelfPublic"`
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

type UserStatsDTO struct {
    TotalFollowers     int `json:"totalFollowers"`
    TotalFollowing     int `json:"totalFollowing"`
    TotalPosts         int `json:"totalPosts"`
    TotalBadges        int `json:"totalBadges"`        // <-- TAMBAHKAN
    TotalAchievements  int `json:"totalAchievements"`  // <-- TAMBAHKAN
}

// SocialLinkDTO merepresentasikan satu link sosial milik user.
// Ini adalah gabungan data dari user_social_links dan platforms.
type SocialLinkDTO struct {
	PlatformName     string `json:"platformName"`
	URL              string `json:"url"`
	PlatformSlug     string `json:"platformSlug"`
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
	IsBookshelfPublic *bool `json:"is_bookshelf_public"`
	AllowDmFromPublic *bool
	RemoveAvatar *bool `json:"remove_avatar"`
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

// UserSummaryDTO merepresentasikan data ringkas seorang user dalam sebuah daftar.
type UserSummaryDTO struct {
	Username      string          `json:"username"`
	DisplayName   string          `json:"displayName"`
	AvatarURL     string          `json:"avatarUrl"`
	ViewerContext *FollowerContextDTO `json:"viewerContext,omitempty"`
}

// FollowerContextDTO adalah konteks spesifik untuk daftar follower/following.
type FollowerContextDTO struct {
	IsFollowing    bool `json:"isFollowing"`    // Apakah SAYA follow orang ini?
	IsFollowedBy   bool `json:"isFollowedBy"`   // Apakah orang ini follow SAYA?
	IsOwnProfile   bool `json:"isOwnProfile"`
	IsPending    bool `json:"isPending"`
}

type FriendRecommendationResponse struct {
	ID             uint   `json:"id"`
	Name           string `json:"name"`
	Username       string `json:"username"`
	Avatar         *string `json:"avatar"`
	Bio            string `json:"bio"`
	TotalFollowers int    `json:"total_followers"`
	TotalFollowing int    `json:"total_following"`

	MatchScore     int    `json:"match_score"`
	MutualScore    int    `json:"mutual_score"`
	GenreScore     int    `json:"genre_score"`
	ActivityScore  int    `json:"activity_score"`
}