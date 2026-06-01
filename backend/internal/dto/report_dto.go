package dto

import "time"

/* --- REPORT SUMMARY --- */

type ReportFilterRequest struct {
	Search string `form:"search" json:"search" query:"search"`
	Status string `form:"status" json:"status" query:"status"`
	Type   string `form:"type" json:"type" query:"type"`
	Page   int    `form:"page" json:"page" query:"page"`
	Limit  int    `form:"limit" json:"limit" query:"limit"`
}

// Response baru yang membungkus metadata pagination
type PaginatedReportResponse struct {
	Data        []ReportDashboardResponse `json:"data"`
	TotalCount  int64                     `json:"total_count"`
	CurrentPage int                       `json:"current_page"`
	TotalPages  int                       `json:"total_pages"`
}

type ReportDashboardResponse struct {
	ReportSummaryID uint      `json:"report_summary_id"`
	EntityID        int       `json:"entity_id"`
	EntityType      string    `json:"entity_type"` // "user" atau "post"
	Target          string    `json:"target"`      // username jika user, description jika post
	TotalReports    int       `json:"total_reports"`
	UniqueReports   int       `json:"unique_reports"`
	LastReport      time.Time `json:"last_report"`
	Status          string    `json:"status"`      // "Reviewed" atau "Not reviewed"
}

/* --- REPORT SUMMARY DETAIL --- */

type ReasonCount struct {
	ReasonText string `json:"reason_text"`
	Count      int    `json:"count"`
}

type UserDetailReport struct {
	AvatarURL      string    `json:"avatar_url"`
	DisplayName    string    `json:"display_name"`
	Username       string    `json:"username"`
	Bio            string    `json:"bio"`
	CreatedAt      time.Time `json:"created_at"`
	Status         string    `json:"status"`
	EmailVerified  bool      `json:"email_verified"`
	Location       string    `json:"location"`
	TotalFollowers int       `json:"total_followers"`
	TotalFollowing int       `json:"total_following"`
	TotalPosts     int       `json:"total_posts"`
	HotScore       float64   `json:"hot_score"`
}

type PostDetailReport struct {
	PublicID   	  string  `json:"public_id"`
	Description   string  `json:"description"`
	PostType      string  `json:"post_type"`
	Username      string  `json:"username"`
	ImgURL        string  `json:"img_url"`
	PublishStatus string  `json:"publish_status"`
	BookTitle     string  `json:"book_title"`
	PostSlug      string  `json:"post_slug"` // 8 char public_id + slug title
	LikeCount     int     `json:"like_count"`
	CommentCount  int     `json:"comment_count"`
	ShareCount    int     `json:"share_count"`
	SaveCount     int     `json:"save_count"`
	HotScore      float64 `json:"hot_score"`
}

type ModerationHistory struct {
	AdminActionID uint       `json:"admin_action_id"`
	ActionType    string     `json:"action_type"`
	Reason        *string    `json:"reason"`
	DurationDays  *int       `json:"duration_days"`

	AdminUsername string     `json:"admin_username"`

	CreatedAt     time.Time  `json:"created_at"`
}

type ReportSummaryDetailResponse struct {
	ReportSummaryID uint              `json:"report_summary_id"`
	EntityID        int               `json:"entity_id"`
	EntityType      string            `json:"entity_type"`
	TotalReports    int               `json:"total_reports"`
	UniqueReports   int               `json:"unique_reports"`
	FirstReport     time.Time         `json:"first_report"`
	LastReport      time.Time         `json:"last_report"`
	Status          string            `json:"status"`
	ReasonCounts    []ReasonCount     `json:"reason_counts"`
	UserData        *UserDetailReport `json:"user_data,omitempty"`
	PostData        *PostDetailReport `json:"post_data,omitempty"`
	ModerationHistory *ModerationHistory `json:"moderation_history,omitempty"`
}

/* --- ADMIN ACTION --- */
type AdminActionRequest struct {
	ReportSummaryID uint   `json:"report_summary_id" binding:"required"`
	ActionType      string `json:"action" binding:"required"` // dismiss, warning, shadowban_user, suspend, ban_permanent, shadowban_post, soft_delete, hard_delete
	DurationDays    *int   `json:"duration_days"`             // null jika instan/tidak bernilai, -1 jika permanen
	Reason          string `json:"reason"`
}

type AdminActionResponse struct {
	Message string `json:"message"`
	Status  string `json:"status"`
}