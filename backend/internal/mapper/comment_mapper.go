package mapper

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
)

func ToCommentResponse(c models.PostComment, currentUserID uint) dto.CommentResponse {
	var avatar string
	var username string
	var userPublicID string

	if c.User.Profile != nil {
		avatar = c.User.Profile.AvatarUrl
		username = c.User.Username
		userPublicID = c.User.PublicID.String()
	}

	isLiked := false
    if len(c.Likes) > 0 {
        isLiked = true
    }

	response := dto.CommentResponse{
		ID:        c.PostCommentID,
		UserID:    c.UserID,
		UserPublicID: userPublicID,
        ParentCommentID: c.ParentCommentID,
		Username:  username,
		Avatar:    avatar,
		Comment:   c.Comment,
		CreatedAt: c.CreatedAt,
		LikeCount:  c.LikeCount, // Pastikan field ini ada di model
        IsLiked:    isLiked,
	}

	if len(c.Replies) > 0 {
		response.Replies = ToCommentResponseList(c.Replies, currentUserID)
	} else {
		response.Replies = []dto.CommentResponse{}
	}

	return response
}

// ToCommentResponseList mengubah slice/array model ke slice DTO
func ToCommentResponseList(comments []models.PostComment, currentUserID uint) []dto.CommentResponse {
    var responses []dto.CommentResponse
    for _, c := range comments {
        // ✅ Sekarang argumen sudah sesuai dengan definisi fungsi di atas (2 argumen)
        responses = append(responses, ToCommentResponse(c, currentUserID))
    }
    return responses
}

func ToSingleCommentResponse(c models.PostComment, currentUserID uint) dto.CommentResponse {
    var avatar string
    var username string
    var userPublicID string

    if c.User.Profile != nil {
        avatar = c.User.Profile.AvatarUrl
        username = c.User.Username
        userPublicID = c.User.PublicID.String()
    }

    isLiked := false
    // Cek apakah user saat ini ada di dalam list Likes yang di-preload
    for _, like := range c.Likes {
        if like.UserID == currentUserID {
            isLiked = true
            break
        }
    }

    return dto.CommentResponse{
        ID:           c.PostCommentID,
        UserID:       c.UserID,
        UserPublicID: userPublicID,
        ParentCommentID: c.ParentCommentID,
        Username:     username,
        Avatar:       avatar,
        Comment:      c.Comment,
        CreatedAt:    c.CreatedAt,
        LikeCount:    c.LikeCount,
        IsLiked:      isLiked,
        Replies:      []dto.CommentResponse{},
    }
}