package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
    UserID         uint           `gorm:"column:user_id;primaryKey;autoIncrement"`
    PublicID       uuid.UUID      `gorm:"column:public_id;type:uuid;default:gen_random_uuid();unique;not null"`
    Email          string         `gorm:"column:email;type:varchar(255);unique;not null"`
    Username       string         `gorm:"column:username;type:varchar(100);unique;not null"`
    PasswordHash   string         `gorm:"column:password_hash;type:text;not null"`
    Role           string         `gorm:"column:role;type:varchar(50);not null;default:'user'"`
    Status         string         `gorm:"column:status;type:varchar(10);not null;default:'active'"`
    IsActive       bool           `gorm:"column:is_active;not null;default:true"`
    EmailVerified  bool           `gorm:"column:email_verified;not null;default:false"`
    LastLogin      *time.Time     `gorm:"column:last_login"`
    CreatedAt      time.Time      `gorm:"column:created_at;autoCreateTime"`
    UpdatedAt      time.Time      `gorm:"column:updated_at;autoUpdateTime"`
    DeletedAt      gorm.DeletedAt `gorm:"column:deleted_at;index:idx_users_deleted_at"`
    
    Profile        *UserProfile    `gorm:"foreignKey:UserID;references:UserID"`
    Settings       *UserSetting   `gorm:"foreignKey:UserID;references:UserID"`
    PasswordResets []PasswordReset `gorm:"foreignKey:UserID"`
    Sessions       []UserSession   `gorm:"foreignKey:UserID"`
    SocialLinks    []UserSocialLink  `gorm:"foreignKey:UserID"`
    Posts          []Post            `gorm:"foreignKey:UserID"`

    FavoriteUserBadges []UserBadge `gorm:"foreignKey:UserID;references:UserID"`
	FavoriteUserAchievements []UserAchievement `gorm:"foreignKey:UserID;references:UserID"`
}

type UserProfile struct {
    UserProfileID uint      `gorm:"column:user_profile_id;primaryKey;autoIncrement"`
    PublicID      uuid.UUID `gorm:"column:public_id;type:uuid;default:gen_random_uuid();unique;not null"`
    UserID        uint      `gorm:"column:user_id;not null;unique"`
    DisplayName   string   `gorm:"column:display_name;type:varchar(150)"`
    Bio           string   `gorm:"column:bio;type:text"`
	AvatarUrl     string   `gorm:"column:avatar_url;type:text"`
	Gender        string   `gorm:"column:gender;type:varchar(20)"`
	Location      string   `gorm:"column:location;type:varchar(255)"`
    CreatedAt     time.Time `gorm:"column:created_at;autoCreateTime"`
    UpdatedAt     time.Time `gorm:"column:updated_at;autoUpdateTime"`

    // Relations
	User User `gorm:"foreignKey:UserID;references:UserID"`
}

type UserSetting struct {
	UserSettingID      uint      `gorm:"primaryKey"`
	PublicID           uuid.UUID `gorm:"type:uuid;unique;not null;default:gen_random_uuid()"`
	UserID             uint      `gorm:"not null;unique"` // UserID harus unik, 1 user 1 setting
	IsProfilePublic    bool      `gorm:"not null;default:true"`
	ShowActivityHeatmap bool      `gorm:"not null;default:true"`
	AllowDmFromPublic  bool      `gorm:"not null;default:true"`
	CreatedAt          time.Time `gorm:"not null;default:now()"`
	UpdatedAt          time.Time `gorm:"not null;default:now()"`

    // Relations
	User User `gorm:"foreignKey:UserID;references:UserID"`
}

type UserSession struct {
	UserSessionID    uint       `gorm:"column:user_session_id;primaryKey;autoIncrement"`
	PublicID         uuid.UUID  `gorm:"column:public_id;type:uuid;default:gen_random_uuid();unique;not null"`
	UserID           uint       `gorm:"column:user_id;not null"`
	RefreshTokenHash string     `gorm:"column:refresh_token_hash;type:text;not null"`
	DeviceInfo       string    `gorm:"column:device_info;type:text"`
	IpAddress        string    `gorm:"column:ip_address;type:inet"`
	ExpiresAt        time.Time  `gorm:"column:expires_at;not null"`
	RevokedAt        *time.Time `gorm:"column:revoked_at"`

    // Relations
	User User `gorm:"foreignKey:UserID;references:UserID"`
}

type PasswordReset struct {
    PasswordResetID uint        `gorm:"column:password_reset_id;primaryKey;autoIncrement"`
    PublicID        uuid.UUID   `gorm:"column:public_id;type:uuid;default:gen_random_uuid();unique;not null"`
    UserID          uint        `gorm:"column:user_id;not null"`
    TokenHash       string      `gorm:"column:token_hash;type:text;not null"`
    ExpiresAt       time.Time   `gorm:"column:expires_at;not null"`
    UsedAt          *time.Time  `gorm:"column:used_at"`
    CreatedAt       time.Time   `gorm:"column:created_at;autoCreateTime"`

    // Relations
	User User `gorm:"foreignKey:UserID;references:UserID"`
}


// UserStat merepresentasikan tabel 'user_stats' di database.
type UserStat struct {
	UserID         uint      `gorm:"primaryKey"`
	TotalFollowers int       `gorm:"not null;default:0"`
	TotalFollowing int       `gorm:"not null;default:0"`
	TotalPosts     int       `gorm:"not null;default:0"`
    TotalBadges        int `json:"totalBadges"`        
    TotalAchievements  int `json:"totalAchievements"`
	UpdatedAt      time.Time `gorm:"autoUpdateTime"`

	// Relasi: Statistik ini dimiliki oleh satu user.
	User User `gorm:"foreignKey:UserID"`
}