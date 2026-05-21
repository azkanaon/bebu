package repositories

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"

	"gorm.io/gorm"

	"math"
	"strings"
	"time"
	"context"
	"errors"
)

type BookRepository interface {
	FindAll() ([]models.Book, error)
	GetDynamicFilters(genre string, author string, language string,) (*dto.BookFilterResponse, error)
	SearchBooks(query string, genre string, author string, language string, page int, limit int,) (*dto.BookSearchResponse, error)
	GetPopularBooks(timeRange string, limit int,) ([]dto.PopularBookItem, error)
	GetHighlyRatedBooks(limit int,) ([]dto.HighlyRatedBookItem, error)
	GetAllBooks(page int, limit int, sort string,) (*dto.AllBooksResponse, error)
	GetBySlug(ctx context.Context, slug string) (*models.Book, error)
	GetRecommendationsByGenres(ctx context.Context, currentBookID uint, genreIDs []uint, limit int) ([]models.Book, error)
	GetRecommendationsByAuthors(ctx context.Context, currentBookID uint, authorIDs []uint, limit int) ([]models.Book, error)
	GetBookPosts(ctx context.Context, bookID uint, postType string, cursor uint, limit int, userID uint) ([]models.Post, error)
}

type bookRepository struct {
	db *gorm.DB
}

type PopularBookRanking struct {
	BookID          uint
	PopularityScore int
}

type HighlyRatedRanking struct {
	BookID         uint
	WeightedScore  float64
}

func NewBookRepository(db *gorm.DB) BookRepository {
    return &bookRepository{
        db: db,
    }
}

func (r *bookRepository) FindAll() ([]models.Book, error) {
	var books []models.Book

	err := r.db.
		Select("book_id, title").
		Find(&books).Error

	return books, err
}

func (r *bookRepository) GetDynamicFilters(genre string, author string, language string,) (*dto.BookFilterResponse, error) {

	baseQuery := r.db.Model(&models.Book{}).
		Joins("JOIN book_authors ba ON ba.book_id = books.book_id").
		Joins("JOIN authors a ON a.author_id = ba.author_id").
		Joins("JOIN book_genres bg ON bg.book_id = books.book_id").
		Joins("JOIN genres g ON g.genre_id = bg.genre_id").
		Where("books.deleted_at IS NULL").
        Where("a.deleted_at IS NULL").
        Where("g.deleted_at IS NULL")

	// APPLY FILTERS
	if genre != "" {
		baseQuery = baseQuery.Where("g.genre_name = ?", genre)
	}

	if author != "" {
		baseQuery = baseQuery.Where("a.author_name = ?", author)
	}

	if language != "" {
		baseQuery = baseQuery.Where("books.language = ?", language)
	}

	// CLONE QUERY
	genreQuery := baseQuery.Session(&gorm.Session{})
	authorQuery := baseQuery.Session(&gorm.Session{})
	languageQuery := baseQuery.Session(&gorm.Session{})

	// GENRES
	var genres []string

	err := genreQuery.
		Distinct().
		Where("g.genre_name IS NOT NULL").
		Pluck("g.genre_name", &genres).Error

	if err != nil {
		return nil, err
	}

	// AUTHORS
	var authors []string

	err = authorQuery.
		Distinct().
		Where("a.author_name IS NOT NULL").
		Pluck("a.author_name", &authors).Error

	if err != nil {
		return nil, err
	}

	// LANGUAGES
	var languages []string

	err = languageQuery.
		Distinct().
		Where("books.language IS NOT NULL").
		Pluck("books.language", &languages).Error

	if err != nil {
		return nil, err
	}

	return &dto.BookFilterResponse{
		Genres: genres,
		Authors: authors,
		Languages: languages,
	}, nil
}

func (r *bookRepository) SearchBooks(query string, genre string, author string, language string, page int, limit int,) (*dto.BookSearchResponse, error) {
	offset := (page - 1) * limit

	baseQuery := r.db.Model(&models.Book{}).
		Joins("JOIN book_authors ba ON ba.book_id = books.book_id").
		Joins("JOIN authors a ON a.author_id = ba.author_id").
		Joins("JOIN book_genres bg ON bg.book_id = books.book_id").
		Joins("JOIN genres g ON g.genre_id = bg.genre_id").
		Where("books.deleted_at IS NULL").
		Where("a.deleted_at IS NULL").
		Where("g.deleted_at IS NULL")

	// SEARCH TITLE
	if query != "" {
		baseQuery = baseQuery.Where(
			"LOWER(books.title) LIKE ?",
			"%"+strings.ToLower(query)+"%",
		)
	}

	// FILTERS
	if genre != "" {
		baseQuery = baseQuery.Where(
			"g.genre_name = ?",
			genre,
		)
	}

	if author != "" {
		baseQuery = baseQuery.Where(
			"a.author_name = ?",
			author,
		)
	}

	if language != "" {
		baseQuery = baseQuery.Where(
			"books.language = ?",
			language,
		)
	}

	// TOTAL
	var total int64

	countQuery := baseQuery.Session(&gorm.Session{})

	err := countQuery.
		Distinct("books.book_id").
		Count(&total).Error

	if err != nil {
		return nil, err
	}

	// BOOKS
	var books []models.Book

	bookQuery := baseQuery.Session(&gorm.Session{})

	err = bookQuery.
		Preload("BookAuthors.Author").
		Preload("BookGenres.Genre").
		Preload("BookStat").
		Distinct().
		Limit(limit).
		Offset(offset).
		Order("books.created_at DESC").
		Find(&books).Error

	if err != nil {
		return nil, err
	}

	// MAPPING DTO
	var result []dto.BookSearchItem

	for _, book := range books {

		var authors []string

		for _, ba := range book.BookAuthors {
			authors = append(authors, ba.Author.AuthorName)
		}

		var genres []string

		for _, bg := range book.BookGenres {
			genres = append(genres, bg.Genre.GenreName)
		}

		result = append(result, dto.BookSearchItem{
			PublicID:        book.PublicID,
			Title:           book.Title,
			Synopsis:        book.Synopsis,
			CoverImgURL:     book.CoverImgURL,
			PublicationYear: book.PublicationYear,
			Language:        book.Language,
			Authors:         authors,
			Genres:          genres,
			TotalPages: 	 book.TotalPages,
			Rating:			 book.BookStat.OverallRating,
			GoogleBookID:   book.GoogleBookID,
		})
	}

	totalPages := int(math.Ceil(
		float64(total) / float64(limit),
	))

	return &dto.BookSearchResponse{
		Books:      result,
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}, nil
}

func (r *bookRepository) getPopularBookRankings(timeRange string, limit int,) ([]PopularBookRanking, error) {

	var rankings []PopularBookRanking

	switch timeRange {

	case "today":

		yesterday := time.Now().
			AddDate(0, 0, -1)

		err := r.db.
			Table("book_daily_stats").
			Select(`
				book_id,
				total_posts as popularity_score
			`).
			Where(
				"date = ?",
				yesterday.Format("2006-01-02"),
			).
			Order("popularity_score DESC").
			Limit(limit).
			Scan(&rankings).Error

		return rankings, err

	case "7d":

		start := time.Now().
			AddDate(0, 0, -7)

		err := r.db.
			Table("book_daily_stats").
			Select(`
				book_id,
				SUM(total_posts) as popularity_score
			`).
			Where(
				"date >= ?",
				start.Format("2006-01-02"),
			).
			Group("book_id").
			Order("popularity_score DESC").
			Limit(limit).
			Scan(&rankings).Error

		return rankings, err

	case "30d":

		start := time.Now().
			AddDate(0, 0, -30)

		err := r.db.
			Table("book_daily_stats").
			Select(`
				book_id,
				SUM(total_posts) as popularity_score
			`).
			Where(
				"date >= ?",
				start.Format("2006-01-02"),
			).
			Group("book_id").
			Order("popularity_score DESC").
			Limit(limit).
			Scan(&rankings).Error

		return rankings, err

	default:

		err := r.db.
			Table("book_stats").
			Select(`
				book_id,
				total_posts as popularity_score
			`).
			Order("popularity_score DESC").
			Limit(limit).
			Scan(&rankings).Error

		return rankings, err
	}
}

func (r *bookRepository) getBooksByIDs(bookIDs []uint,) ([]models.Book, error) {
	var books []models.Book

	err := r.db.
		Model(&models.Book{}).
		Preload("BookAuthors.Author").
		Preload("BookStat").
		Where("book_id IN ?", bookIDs).
		Find(&books).Error

	return books, err
}

func (r *bookRepository) GetPopularBooks(timeRange string, limit int,) ([]dto.PopularBookItem, error) {
	rankings, err :=
		r.getPopularBookRankings(
			timeRange,
			limit,
		)

	if err != nil {
		return nil, err
	}

	if len(rankings) == 0 {
		return []dto.PopularBookItem{}, nil
	}

	var bookIDs []uint

	scoreMap := make(map[uint]int)

	for _, ranking := range rankings {

		bookIDs = append(
			bookIDs,
			ranking.BookID,
		)

		scoreMap[ranking.BookID] =
			ranking.PopularityScore
	}

	books, err := r.getBooksByIDs(
		bookIDs,
	)

	if err != nil {
		return nil, err
	}

	bookMap := make(
		map[uint]models.Book,
	)

	for _, book := range books {
		bookMap[book.BookID] = book
	}

	var result []dto.PopularBookItem

	for _, ranking := range rankings {

		book, exists :=
			bookMap[ranking.BookID]

		if !exists {
			continue
		}

		var authors []string

		for _, ba := range book.BookAuthors {
			authors = append(
				authors,
				ba.Author.AuthorName,
			)
		}

		result = append(
			result,
			dto.PopularBookItem{
				PublicID: book.PublicID,
				Title: book.Title,
				CoverImgURL: book.CoverImgURL,
				Rating: book.BookStat.OverallRating,
				TotalPages: book.TotalPages,
				Authors: authors,
				PopularityScore: scoreMap[book.BookID],
				PublicationYear: book.PublicationYear,
			},
		)
	}

	return result, nil
}

func (r *bookRepository) getGlobalAverageRating() (float64, error,) {

	var average float64

	err := r.db.
		Table("book_stats").
		Select("AVG(overall_rating)").
		Scan(&average).Error

	return average, err
}

func (r *bookRepository) getHighlyRatedRankings(page int, limit int,) ([]HighlyRatedRanking, int64, error,) {

	globalAverage, err :=
		r.getGlobalAverageRating()

	if err != nil {
		return nil, 0, err
	}

	m := 5

	offset := (page - 1) * limit

	baseQuery := r.db.
		Table("book_stats").
		Select(`
			book_id,

			(
				(total_reviews::float /
				(total_reviews + ?))
				* overall_rating

				+

				(?::float /
				(total_reviews + ?))
				* ?
			)

			as weighted_score
		`,
			m,
			m,
			m,
			globalAverage,
		)

	var total int64

	err = baseQuery.
		Count(&total).Error

	if err != nil {
		return nil, 0, err
	}

	var rankings []HighlyRatedRanking

	err = baseQuery.
		Order(`
			weighted_score DESC,
			book_id ASC
		`).
		Limit(limit).
		Offset(offset).
		Scan(&rankings).Error

	if err != nil {
		return nil, 0, err
	}

	return rankings, total, nil
}

func (r *bookRepository) mapBooksToSearchItems(books []models.Book,) []dto.BookSearchItem {
	var items []dto.BookSearchItem

	for _, book := range books {

		var authors []string
		var genres []string

		for _, ba := range book.BookAuthors {

			authors = append(
				authors,
				ba.Author.AuthorName,
			)
		}

		for _, bg := range book.BookGenres {

			genres = append(
				genres,
				bg.Genre.GenreName,
			)
		}

		items = append(
			items,
			dto.BookSearchItem{
				PublicID: book.PublicID,
				Title: book.Title,
				Synopsis: book.Synopsis,
				CoverImgURL: book.CoverImgURL,
				PublicationYear: book.PublicationYear,
				Language: book.Language,
				Authors: authors,
				Genres: genres,
				TotalPages: book.TotalPages,
				Rating: book.BookStat.OverallRating,
			},
		)
	}

	return items
}

func (r *bookRepository) GetHighlyRatedBooks(limit int,) ([]dto.HighlyRatedBookItem, error) {
	rankings, _, err := r.getHighlyRatedRankings(1, limit,)

	if err != nil {
		return nil, err
	}

	if len(rankings) == 0 {
		return []dto.HighlyRatedBookItem{},
			nil
	}

	var bookIDs []uint

	scoreMap := make(map[uint]float64)

	for _, ranking := range rankings {

		bookIDs = append(
			bookIDs,
			ranking.BookID,
		)

		scoreMap[ranking.BookID] =
			ranking.WeightedScore
	}

	books, err := r.getBooksByIDs(
		bookIDs,
	)

	if err != nil {
		return nil, err
	}

	bookMap := make(
		map[uint]models.Book,
	)

	for _, book := range books {
		bookMap[book.BookID] = book
	}

	var result []dto.HighlyRatedBookItem

	for _, ranking := range rankings {

		book, exists :=
			bookMap[ranking.BookID]

		if !exists {
			continue
		}

		var authors []string

		for _, ba := range book.BookAuthors {

			authors = append(
				authors,
				ba.Author.AuthorName,
			)
		}

		result = append(
			result,
			dto.HighlyRatedBookItem{
				PublicID: book.PublicID,
				Title: book.Title,
				CoverImgURL: book.CoverImgURL,
				Rating: book.BookStat.OverallRating,
				WeightedScore: scoreMap[book.BookID],
				TotalReviews: book.BookStat.TotalReviews,
				TotalPages: book.TotalPages,
				Authors: authors,
				PublicationYear: book.PublicationYear,
			},
		)
	}

	return result, nil
}

func (r *bookRepository) GetAllBooks(page int, limit int, sort string,) (*dto.AllBooksResponse, error) {
	offset := (page - 1) * limit

	query := r.db.
		Model(&models.Book{}).
		Preload("BookAuthors.Author").
		Preload("BookGenres.Genre").
		Preload("BookStat")

	switch sort {

	case "newest":

		query = query.
			Order("publication_year DESC")

	case "rating":

		rankings, total, err :=
			r.getHighlyRatedRankings(
				page,
				limit,
			)

		if err != nil {
			return nil, err
		}

		if len(rankings) == 0 {

			return &dto.AllBooksResponse{
				Books: []dto.BookSearchItem{},
				Page: page,
				Limit: limit,
				Total: total,
				TotalPages: 0,
			}, nil
		}

		var bookIDs []uint

		for _, ranking := range rankings {

			bookIDs = append(
				bookIDs,
				ranking.BookID,
			)
		}

		books, err :=
			r.getBooksByIDs(bookIDs)

		if err != nil {
			return nil, err
		}

		bookMap := make(
			map[uint]models.Book,
		)

		for _, book := range books {
			bookMap[book.BookID] = book
		}

		var orderedBooks []models.Book

		for _, ranking := range rankings {

			book, exists :=
				bookMap[ranking.BookID]

			if exists {

				orderedBooks = append(
					orderedBooks,
					book,
				)
			}
		}

		items :=
			r.mapBooksToSearchItems(
				orderedBooks,
			)

		totalPages := int(math.Ceil(
			float64(total) /
			float64(limit),
		))

		return &dto.AllBooksResponse{
			Books: items,
			Page: page,
			Limit: limit,
			Total: total,
			TotalPages: totalPages,
		}, nil

	case "popular":

		query = query.
			Joins(`
				JOIN book_stats bs
				ON bs.book_id = books.book_id
			`).
			Order("bs.total_posts DESC")

	default:

		query = query.
			Order("title ASC")
	}

	var total int64

	err := query.
		Count(&total).Error

	if err != nil {
		return nil, err
	}

	var books []models.Book

	err = query.
		Limit(limit).
		Offset(offset).
		Find(&books).Error

	if err != nil {
		return nil, err
	}

	var items []dto.BookSearchItem

	for _, book := range books {

		var authors []string
		var genres []string

		for _, ba := range book.BookAuthors {

			authors = append(
				authors,
				ba.Author.AuthorName,
			)
		}

		for _, bg := range book.BookGenres {

			genres = append(
				genres,
				bg.Genre.GenreName,
			)
		}

		items = append(
			items,
			dto.BookSearchItem{
				PublicID: book.PublicID,
				Title: book.Title,
				Synopsis: book.Synopsis,
				CoverImgURL: book.CoverImgURL,
				PublicationYear: book.PublicationYear,
				Language: book.Language,
				Authors: authors,
				Genres: genres,
				TotalPages: book.TotalPages,
				Rating: book.BookStat.OverallRating,
			},
		)
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit),))

	return &dto.AllBooksResponse{
		Books: items,
		Page: page,
		Limit: limit,
		Total: total,
		TotalPages: totalPages,
	}, nil
}

/* --- BOOK PROFILE ---  */

func (r *bookRepository) GetBySlug(ctx context.Context, slug string) (*models.Book, error) {
	var book models.Book

	// Query sangat bersih dan cepat berkat exact match string pada index slug
	err := r.db.WithContext(ctx).
		Preload("BookAuthors.Author").
		Preload("BookGenres.Genre").
		Preload("BookStat"). 
		Where("slug = ?", slug).
		First(&book).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}

	return &book, nil
}

func (r *bookRepository) GetRecommendationsByGenres(ctx context.Context, currentBookID uint, genreIDs []uint, limit int) ([]models.Book, error) {
	var books []models.Book

	if len(genreIDs) == 0 {
		return books, nil
	}

	err := r.db.WithContext(ctx).
		Table("books").
		// Ambil semua kolom books dan ambil overall_rating dari book_stats dimasukkan ke preload struct stat nantinya
		Select("books.*, MAX(book_stats.overall_rating) as dynamic_rating"). 
		Joins("JOIN book_genres ON book_genres.book_id = books.book_id").
		Joins("LEFT JOIN book_stats ON book_stats.book_id = books.book_id").
		Preload("BookAuthors.Author"). 
		Preload("BookStat"). // Pastikan stat ikut di-preload agar data objeknya terbentuk
		Where("book_genres.genre_id IN ?", genreIDs).
		Where("books.book_id != ?", currentBookID). 
		Where("books.deleted_at IS NULL").
		Group("books.book_id, book_stats.overall_rating"). // Tambah group-by untuk kolom rating
		Order("COUNT(book_genres.genre_id) DESC, book_stats.overall_rating DESC").
		Limit(limit).
		Find(&books).Error

	return books, err
}

func (r *bookRepository) GetRecommendationsByAuthors(ctx context.Context, currentBookID uint, authorIDs []uint, limit int) ([]models.Book, error) {
	var books []models.Book

	if len(authorIDs) == 0 {
		return books, nil
	}

	err := r.db.WithContext(ctx).
		Table("books").
		Select("books.*").
		Joins("JOIN book_authors ON book_authors.book_id = books.book_id").
		Joins("LEFT JOIN book_stats ON book_stats.book_id = books.book_id").
		Preload("BookAuthors.Author"). 
		Preload("BookStat"). // Ikut di-preload juga di sini
		Where("book_authors.author_id IN ?", authorIDs).
		Where("books.book_id != ?", currentBookID). 
		Where("books.deleted_at IS NULL").
		Order("book_stats.overall_rating DESC, books.publication_year DESC"). // Utamakan rating tertinggi penulis tersebut
		Limit(limit).
		Find(&books).Error

	return books, err
}

func (r *bookRepository) GetBookPosts(ctx context.Context, bookID uint, postType string, cursor uint, limit int, userID uint) ([]models.Post, error) {
	var posts []models.Post

	query := r.db.WithContext(ctx).
		Select(`posts.*, 
			(SELECT EXISTS (SELECT 1 FROM post_likes WHERE post_id = posts.post_id AND user_id = ?)) as is_liked,
			(SELECT EXISTS (SELECT 1 FROM post_saves WHERE post_id = posts.post_id AND user_id = ?)) as is_saved`,
			userID, userID).
		Preload("User.Profile").
		Preload("Book.BookAuthors.Author").
		Preload("Book.BookGenres.Genre").
		Preload("Stats").
		Preload("Categories"). // Untuk keperluan post tipe Analysis
		Where("posts.book_id = ?", bookID).
		Where("posts.post_type = ?", postType).
		Where("posts.publish_status = ?", "published")

	// Cursor Pagination
	if cursor > 0 {
		query = query.Where("posts.post_id < ?", cursor)
	}

	err := query.Order("posts.post_id DESC").Limit(limit).Find(&posts).Error
	if err != nil {
		return nil, err
	}

	// Map GORM virtual column ke struct field jika diperlukan
	for i := range posts {
		if posts[i].Stats != nil {
			posts[i].TotalLikes = posts[i].Stats.LikeCount
		}
	}

	return posts, nil
}