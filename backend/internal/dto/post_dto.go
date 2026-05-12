package dto

import (
	"time"

	"github.com/google/uuid"
)

type ReviewPostResponse struct {
	ID   uint `json:"id"`
	PostPublicID string `json:"post_public_id"`
	Type string `json:"type"`

	User struct {
		PublicID    uuid.UUID `json:"publicID"`
		Username    string `json:"username"`
		DisplayName string `json:"displayName"`
		Avatar      string `json:"avatar"`
	} `json:"user"`

	CreatedAt time.Time `json:"createdAt"`
	Content   string `json:"content"`

	IsLiked   bool   `json:"is_liked"`
	IsSaved   bool   `json:"is_saved"`
		
	Likes    int  `json:"likes"`
	Comments int  `json:"comments"`
	Shares   int  `json:"shares"`
	Saved    int `json:"saved"`

	CommentList []CommentResponse `json:"comment_list"`

	Book struct {
		Title  string   `json:"title"`
		Author string   `json:"author"`
		Pages  int      `json:"pages"`
		Cover  string   `json:"cover"`
		Genres []string `json:"genres"`
		Rating int      `json:"rating"`
	} `json:"book"`
}

type AnalysisPostResponse struct {
	ID        uint `json:"id"`
	PostPublicID string `json:"post_public_id"`
	Type      string `json:"type"`
	Content   string `json:"content"`
	Image     string `json:"image"`
	CreatedAt time.Time `json:"createdAt"`

	Likes    int `json:"likes"`
	Comments int `json:"comments"`
	Shares   int `json:"shares"`

	CommentList []CommentResponse `json:"comment_list"`

	IsLiked   bool   `json:"is_liked"`
	IsSaved   bool   `json:"is_saved"`

	User struct {
		PublicID    uuid.UUID `json:"publicID"`
		DisplayName string `json:"displayName"`
		Avatar      string `json:"avatar"`
	} `json:"user"`

	Book struct {
		Title string `json:"title"`
		Cover string `json:"cover"`
	} `json:"book"`

	Categories []CategoryResponse `json:"categories"`
}

type CreatePostRequest struct {
	UserID      uint     `json:"user_id"`
	BookID      uint     `json:"book_id"`
	Description string   `json:"description"`
	PostType    string   `json:"post_type"` // review | analysis
	Rating      float64  `json:"rating"`
	ImgURL      string   `json:"img_url"`
	Categories  []string `json:"categories"` // 🔥 nama kategori
}

type PostSummaryDTO struct {
	PublicID    string          `json:"publicId"`
	Description string          `json:"description,omitempty"`
	ImgURL      string          `json:"imgUrl,omitempty"`
	PostType    string          `json:"postType"`
	Rating      *float32        `json:"rating,omitempty"`
	PublishedAt *time.Time      `json:"publishedAt,omitempty"`
	Stats       PostStatsDTO    `json:"stats"`
	Book        *BookSummaryDTO `json:"book,omitempty"` // Buku bisa jadi opsional
}

type PostStatsDTO struct {
	LikeCount    int `json:"likeCount"`
	CommentCount int `json:"commentCount"`
	SaveCount    int `json:"saveCount"`
}

type ShareRequest struct {
	PostID      uint   `json:"post_id" binding:"required"`
	ReceiverIDs []uint `json:"receiver_ids" binding:"required"`
	Message     string `json:"message"`
}

type ShareResponse struct {
	Message string `json:"message"`
	Count   int    `json:"count"`
}

// Untuk recet user di Share Modal
type UserSearchResponse struct {
    ID          uint   `json:"id"`
    Username    string `json:"username"`
    DisplayName string `json:"display_name"`
    Avatar      string `json:"avatar"`
}