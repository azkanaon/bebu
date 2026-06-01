package mapper

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"strings"
)

func ToBookReviewPostResponse(p models.Post, currentUserID uint) dto.BookPostReviewResponse {
	var res dto.BookPostReviewResponse

	res.ID = p.PostID
	res.PostPublicID = p.PublicID.String()
	res.Type = strings.ToLower(p.PostType)
	res.Content = p.Description
	res.CreatedAt = p.CreatedAt
	res.Book.Rating = float32(p.Rating) // Menggunakan float32 sesuai DTO profil buku baru

	if p.User != nil && p.User.Profile != nil {
		res.User.PublicID = p.User.PublicID.String() // Konversi ke string jika tipe di model adalah UUID
		res.User.Username = p.User.Username
		res.User.DisplayName = p.User.Profile.DisplayName
		res.User.Avatar = p.User.Profile.AvatarUrl
	}

	if p.Book != nil {
		res.Book.Title = p.Book.Title
		res.Book.Cover = p.Book.CoverImgURL
		res.Book.Pages = p.Book.TotalPages

		res.Book.Author = "Unknown Author"
		if len(p.Book.BookAuthors) > 0 {
			var authors []string
			for _, ba := range p.Book.BookAuthors {
				if ba.Author.AuthorName != "" {
					authors = append(authors, ba.Author.AuthorName)
				}
			}
			if len(authors) > 0 {
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
	}

	res.Rating  = int(p.Rating)
	res.IsLiked = p.IsLiked
	res.IsSaved = p.IsSaved

	// Safety Guard check p.Stats agar aman dari nil pointer panic
	if p.Stats != nil {
		res.Likes = p.Stats.LikeCount
		res.Comments = p.Stats.CommentCount
		res.Shares = p.Stats.ShareCount
	}

	return res
}

func ToBookAnalysisPostResponse(p models.Post, currentUserID uint) dto.BookPostAnalysisResponse {
	var res dto.BookPostAnalysisResponse

	res.ID = p.PostID
	res.PostPublicID = p.PublicID.String()
	res.Type = strings.ToLower(p.PostType)
	res.Content = p.Description
	res.Image = p.ImgURL
	res.CreatedAt = p.CreatedAt

	if p.User != nil && p.User.Profile != nil {
		res.User.PublicID = p.User.PublicID.String()
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

	res.Categories = []dto.CategoryResponse{}
	for _, cat := range p.Categories {
		res.Categories = append(res.Categories, dto.CategoryResponse{
			ID:   cat.CategoryID,
			Name: cat.CategoryName,
		})
	}

	return res
}