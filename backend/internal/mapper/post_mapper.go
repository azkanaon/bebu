package mapper

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"strings"
)

func ToReviewPostResponse(p models.Post, currentUserID uint) dto.ReviewPostResponse {
	var res dto.ReviewPostResponse

	res.ID = p.PostID
	res.Type = strings.ToLower(p.PostType)
	res.Content = p.Description
	res.CreatedAt = p.CreatedAt.Format("2006-01-02")
	res.Book.Rating = int(p.Rating)

	// USER
	if p.User != nil && p.User.Profile != nil {
		res.User.Username = p.User.Username
		res.User.DisplayName = p.User.Profile.DisplayName
		res.User.Avatar = p.User.Profile.AvatarUrl
	}

	if p.Book != nil {
		res.Book.Title = p.Book.Title
		res.Book.Cover = p.Book.CoverImgURL
		res.Book.Pages = p.Book.TotalPages

		// 🔥 AUTHORS (pivot model)
		if len(p.Book.BookAuthors) > 0 {
			var authors []string

			for _, ba := range p.Book.BookAuthors {
				if ba.Author.AuthorName != "" {
					authors = append(authors, ba.Author.AuthorName)
				}
			}

			res.Book.Author = strings.Join(authors, ", ")
		}
	}

	res.Book.Genres = []string{}

	if len(p.Book.BookGenres) > 0 {
		for _, bg := range p.Book.BookGenres {
			if bg.Genre.GenreID != 0 {
				res.Book.Genres = append(res.Book.Genres, bg.Genre.GenreName)
			}
		}
	}

	res.IsLiked = p.IsLiked
	res.IsSaved = p.IsSaved

	res.Likes = p.Stats.LikeCount
	res.Comments = p.Stats.CommentCount
	res.Saved = p.Stats.SaveCount

	res.CommentList = []dto.CommentResponse{}
	for _, commentModel := range p.Comments {
		commentDTO := ToCommentResponse(commentModel, currentUserID)
		res.CommentList = append(res.CommentList, commentDTO)
	}

	return res
}

func ToAnalysisPostResponse(p models.Post, currentUserID uint) dto.AnalysisPostResponse {
	var res dto.AnalysisPostResponse

	res.ID = p.PostID
	res.Type = strings.ToLower(p.PostType)
	res.Content = p.Description
	res.Image = p.ImgURL
	res.CreatedAt = p.CreatedAt.Format("2006-01-02")

	if p.User != nil && p.User.Profile != nil {
		res.User.DisplayName = p.User.Profile.DisplayName
		res.User.Avatar = p.User.Profile.AvatarUrl
	}

	if p.Book != nil {
		res.Book.Title = p.Book.Title
		res.Book.Cover = p.Book.CoverImgURL
	}

	res.IsLiked = p.IsLiked
	res.IsSaved = p.IsSaved

	if p.Stats != nil {
		res.Likes = p.Stats.LikeCount
		res.Comments = p.Stats.CommentCount
		res.Shares = p.Stats.ShareCount
	}

	res.CommentList = []dto.CommentResponse{}
	for _, commentModel := range p.Comments {
		commentDTO := ToCommentResponse(commentModel, currentUserID)
		res.CommentList = append(res.CommentList, commentDTO)
	}

	return res
}