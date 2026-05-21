package repositories

import (
	"backend-bebu/internal/models"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type BookshelfRepository interface {
	GetBookshelvesByUserID(userID uint, status string, search string, page, limit int) ([]models.UserBookshelf, int64, error)
	GetBookshelfEntryByID(id uint) (*models.UserBookshelf, error)
	AddToBookshelf(bookshelf *models.UserBookshelf) (*models.UserBookshelf, error)
	FindBookshelfByID(id uint) (*models.UserBookshelf, error)
	UpdateBookshelf(entry *models.UserBookshelf) (*models.UserBookshelf, error)
	DeleteBookshelfEntry(entry *models.UserBookshelf) error
	AddNoteToBookshelf(note *models.Note) (*models.Note, error)
	GetNotesByBookshelfID(bookshelfID uint, noteType string, page, limit int) ([]models.Note, int64, error)
	FindNoteByID(noteID uint) (*models.Note, error)
	UpdateNote(note *models.Note) (*models.Note, error)
	DeleteNote(note *models.Note) error
	UpdateUserStreak(db *gorm.DB, userID uint) error
	GetReadingStats(userID uint) (*models.UserReadingStat, error)
	GetMaxPageEndFromNotes(db *gorm.DB, bookshelfID uint) (int, error)

	WithTx(tx *gorm.DB) BookshelfRepository
	ResetExpiredStreaks() error

	FindBookByGoogleID(googleBookID string) (*models.Book, error)
	GetOrCreateAuthor(tx *gorm.DB, name string) (*models.Author, error)
	GetOrCreateGenre(tx *gorm.DB, name string) (*models.Genre, error)

	GetBookshelfEntryByUserIDAndBookID(userID, bookID uint) (*models.UserBookshelf, error)
	SyncBookRating(db *gorm.DB, bookID uint, rating float32, isDelete bool) error
	SyncBookStats(db *gorm.DB, bookID uint, field string, amount int) error
}

type bookshelfRepository struct {
	db *gorm.DB
}

func NewBookshelfRepository(db *gorm.DB) BookshelfRepository {
	return &bookshelfRepository{db: db}
}

func (r *bookshelfRepository) WithTx(tx *gorm.DB) BookshelfRepository {
	// Mengembalikan instance repository baru dengan handle database transaksi (tx)
	return &bookshelfRepository{db: tx}
}

func (r *bookshelfRepository) GetBookshelvesByUserID(userID uint, status string, search string, page, limit int) ([]models.UserBookshelf, int64, error) {
	var bookshelves []models.UserBookshelf
	var total int64
	offset := (page - 1) * limit

	// 1. Inisialisasi Query dengan JOIN ke tabel books
	// Kita gunakan Joins agar bisa mengakses kolom 'title' milik tabel books
	query := r.db.Model(&models.UserBookshelf{}).
		Joins("JOIN books ON books.book_id = user_bookshelves.book_id").
		Where("user_bookshelves.user_id = ?", userID)
	
	// 2. Filter berdasarkan Status (jika ada)
	if status != "" {
		query = query.Where("user_bookshelves.shelf_status = ?", status)
	}

	// 3. Filter berdasarkan Judul Buku (Search)
	if search != "" {
		query = query.Where(
			"LOWER(books.title) LIKE ?", 
			"%"+strings.ToLower(search)+"%",
		)
	}

	// 4. Hitung Total Item yang terfilter
	// Penting: Gunakan Distinct jika join menyebabkan baris ganda (walaupun di sini 1-to-1)
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// 5. Ambil Data dengan Preload
	err = query.
		Preload("Book.BookAuthors.Author").
		Offset(offset).
		Limit(limit).
		Order("user_bookshelves.updated_at DESC").
		// Pastikan kita hanya mengambil kolom dari user_bookshelves agar tidak bentrok
		Select("user_bookshelves.*"). 
		Find(&bookshelves).Error

	return bookshelves, total, err
}

func (r *bookshelfRepository) AddToBookshelf(bookshelf *models.UserBookshelf) (*models.UserBookshelf, error) {
	result := r.db.Create(bookshelf)
	if result.Error != nil {
		return nil, result.Error
	}
	return bookshelf, nil
}

func (r *bookshelfRepository) GetBookshelfEntryByID(id uint) (*models.UserBookshelf, error) {
    var entry models.UserBookshelf
    
    err := r.db.
        Preload("User.Settings").
        Preload("Book.BookAuthors.Author").
        Preload("Notes", func(db *gorm.DB) *gorm.DB {
            return db.Order("notes.created_at ASC")
        }).
        First(&entry, id).Error
        
    return &entry, err
}

func (r *bookshelfRepository) FindBookshelfByID(id uint) (*models.UserBookshelf, error) {
	var entry models.UserBookshelf
    // Tambahkan Preload("Book") karena kita butuh data TotalPages
	err := r.db.Preload("Book").First(&entry, id).Error
	return &entry, err
}

// UpdateBookshelf menyimpan perubahan pada sebuah entri bookshelf.
func (r *bookshelfRepository) UpdateBookshelf(entry *models.UserBookshelf) (*models.UserBookshelf, error) {
	result := r.db.Save(entry)
	return entry, result.Error
}

func (r *bookshelfRepository) DeleteBookshelfEntry(entry *models.UserBookshelf) error {
	// GORM's Delete akan menghapus baris yang cocok dengan primary key dari struct yang di-pass.
	result := r.db.Delete(entry)
	
	if result.Error != nil {
		return result.Error
	}
	// Cek jika tidak ada baris yang dihapus (karena ID tidak ditemukan)
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	
	return nil
}

func (r *bookshelfRepository) AddNoteToBookshelf(note *models.Note) (*models.Note, error) {
	result := r.db.Create(note)
	return note, result.Error
}

// FindNoteByID mencari satu catatan berdasarkan ID-nya.
func (r *bookshelfRepository) FindNoteByID(noteID uint) (*models.Note, error) {
	var note models.Note
	// Kita juga preload UserBookshelf agar bisa cek kepemilikan
	err := r.db.Preload("UserBookshelf").First(&note, noteID).Error
	return &note, err
}

// UpdateNote menyimpan perubahan pada sebuah catatan.
func (r *bookshelfRepository) UpdateNote(note *models.Note) (*models.Note, error) {
	result := r.db.Save(note)
	return note, result.Error
}

func (r *bookshelfRepository) DeleteNote(note *models.Note) error {
	result := r.db.Delete(note)
	
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	
	return nil
}

func (r *bookshelfRepository) UpdateUserStreak(db *gorm.DB, userID uint) error {
	var stats models.UserReadingStat
	today := time.Now().Truncate(24 * time.Hour)

	// 1. Ambil data stats (Kita yakin barisnya sudah ada karena dibuat saat register)
	if err := db.Where("user_id = ?", userID).First(&stats).Error; err != nil {
		return err
	}

	// 2. Jika sudah ada aktivitas hari ini, abaikan
	if stats.LastActivityDate != nil && stats.LastActivityDate.Equal(today) {
		return nil
	}

	// 3. Logika Streak
	yesterday := today.AddDate(0, 0, -1)
	if stats.LastActivityDate != nil && stats.LastActivityDate.Equal(yesterday) {
		stats.CurrentStreak += 1
	} else {
		stats.CurrentStreak = 1
	}

	// 4. Update rekor
	if stats.CurrentStreak > stats.LongestStreak {
		stats.LongestStreak = stats.CurrentStreak
	}

	// 5. Simpan (Hanya menjalankan UPDATE)
	stats.LastActivityDate = &today
	return db.Save(&stats).Error
}

func (r *bookshelfRepository) ResetExpiredStreaks() error {	
	return r.db.Model(&models.UserReadingStat{}).
		Where("last_activity_date < CURRENT_DATE - INTERVAL '1 day'").
		Where("current_streak > 0"). // Hanya proses yang streak-nya masih nyala
		Update("current_streak", 0).Error
}

func (r *bookshelfRepository) GetReadingStats(userID uint) (*models.UserReadingStat, error) {
	var stats models.UserReadingStat
	// Kita gunakan FirstOrInit agar jika data belum ada (kasus user lama), 
	// API tidak error dan mengembalikan angka 0.
	err := r.db.Where("user_id = ?", userID).FirstOrInit(&stats, models.UserReadingStat{UserID: userID}).Error
	return &stats, err
}

func (r *bookshelfRepository) GetMaxPageEndFromNotes(db *gorm.DB, bookshelfID uint) (int, error) {
	var maxPage int
	// Ambil nilai page_end tertinggi dari tabel notes untuk bookshelfID ini
	err := db.Model(&models.Note{}).
		Where("user_bookshelf_id = ?", bookshelfID).
		Select("COALESCE(MAX(page_end), 0)"). // Jika tidak ada notes, kembalikan 0
		Scan(&maxPage).Error
	
	return maxPage, err
}

func (r *bookshelfRepository) GetNotesByBookshelfID(bookshelfID uint, noteType string, page, limit int) ([]models.Note, int64, error) {
	var notes []models.Note
	var total int64
	offset := (page - 1) * limit

	query := r.db.Model(&models.Note{}).Where("user_bookshelf_id = ?", bookshelfID)

	// --- TAMBAHKAN LOGIKA FILTER DI SINI ---
	if noteType != "" {
		query = query.Where("type = ?", noteType)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&notes).Error

	return notes, total, err
}

func (r *bookshelfRepository) FindBookByGoogleID(googleBookID string) (*models.Book, error) {
	var book models.Book
	err := r.db.Where("google_book_id = ?", googleBookID).First(&book).Error
	return &book, err
}

func (r *bookshelfRepository) GetOrCreateAuthor(tx *gorm.DB, name string) (*models.Author, error) {
	var author models.Author
	slug := strings.ToLower(strings.ReplaceAll(name, " ", "-"))
	
	err := tx.Where("slug = ?", slug).FirstOrCreate(&author, models.Author{
		AuthorName: name,
		Slug:       slug,
	}).Error
	return &author, err
}

func (r *bookshelfRepository) GetOrCreateGenre(tx *gorm.DB, name string) (*models.Genre, error) {
	var genre models.Genre
	slug := strings.ToLower(strings.ReplaceAll(name, " ", "-"))
    if len(slug) > 30 { slug = slug[:30] }

	err := tx.Where("slug = ?", slug).FirstOrCreate(&genre, models.Genre{
		GenreName: name,
		Slug:      slug,
	}).Error
	return &genre, err
}

func (r *bookshelfRepository) GetBookshelfEntryByUserIDAndBookID(userID, bookID uint) (*models.UserBookshelf, error) {
	var entry models.UserBookshelf
	
	err := r.db.
		Preload("User.Settings"). // Mengikuti penamaan field 'Settings' Anda
		Preload("Book.BookAuthors.Author").
		Preload("Notes", func(db *gorm.DB) *gorm.DB {
			return db.Order("notes.created_at ASC")
		}).
		// Pencarian berdasarkan kombinasi unik User dan Buku
		Where("user_id = ? AND book_id = ?", userID, bookID).
		First(&entry).Error
		
	return &entry, err
}

func (r *bookshelfRepository) SyncBookRating(db *gorm.DB, bookID uint, rating float32, isDelete bool) error {
	amount := 1
	ratingSumChange := rating
	if isDelete {
		amount = -1
		ratingSumChange = -rating
	}

	ratingBucket := int(rating)
	if ratingBucket < 1 { ratingBucket = 1 }
	if ratingBucket > 5 { ratingBucket = 5 }
	ratingColumn := fmt.Sprintf("rating_%d_count", ratingBucket)

	// --- LOGIKA BARU: Hitung Rating Masa Depan (New Rating) ---
	// Kita buat variabel SQL untuk menghitung rata-rata baru di dalam satu query
	newSum := fmt.Sprintf("(book_stats.total_rating_sum + %f)", ratingSumChange)
	newTotal := fmt.Sprintf("NULLIF(book_stats.total_reviews + %d, 0)", amount)
	newRatingFormula := fmt.Sprintf("(%s / CAST(%s AS NUMERIC))", newSum, newTotal)

	// Rumus Hot Score yang menggunakan newRatingFormula, bukan kolom overall_rating
	hotScoreFormula := fmt.Sprintf(`
		(COALESCE(book_stats.total_readers, 0) * 1) + 
		(COALESCE(book_stats.total_reviews + %d, 0) * 3) + 
		(COALESCE(book_stats.total_posts, 0) * 1) + 
		(COALESCE(book_stats.total_notes, 0) * 0.5) + 
		(COALESCE(%s, 0) * 10)
	`, amount, newRatingFormula)

	updateSQL := fmt.Sprintf(`
		UPDATE book_stats 
		SET 
			%s = %s + ?,
			total_rating_sum = total_rating_sum + ?,
			total_reviews = total_reviews + ?,
			overall_rating = COALESCE(%s, 0),
			hot_score = %s,
			updated_at = NOW()
		WHERE book_id = ?
	`, ratingColumn, ratingColumn, newRatingFormula, hotScoreFormula)

	return db.Exec(updateSQL, amount, ratingSumChange, amount, bookID).Error
}

func (r *bookshelfRepository) SyncBookStats(db *gorm.DB, bookID uint, field string, amount int) error {
	fReaders := "COALESCE(book_stats.total_readers, 0)"
	fReviews := "COALESCE(book_stats.total_reviews, 0)"
	fNotes := "COALESCE(book_stats.total_notes, 0)"
	fPosts := "COALESCE(book_stats.total_posts, 0)" // Tambahkan ini

	if field == "total_readers" { fReaders = fmt.Sprintf("(%s + %d)", fReaders, amount) }
	if field == "total_reviews" { fReviews = fmt.Sprintf("(%s + %d)", fReviews, amount) }
	if field == "total_notes" { fNotes = fmt.Sprintf("(%s + %d)", fNotes, amount) }
	if field == "total_posts" { fPosts = fmt.Sprintf("(%s + %d)", fPosts, amount) } // Tambahkan ini

	// Rumus diperbarui: fPosts juga memengaruhi skor
	hotScoreFormula := fmt.Sprintf(`
		(%s * 1) + 
		(%s * 3) + 
		(%s * 1) + 
		(%s * 0.5) + 
		(COALESCE(book_stats.overall_rating, 0) * 10)
	`, fReaders, fReviews, fPosts, fNotes)

	return db.Model(&models.BookStat{}).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "book_id"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			field:        gorm.Expr("book_stats."+field+" + ?", amount),
			"hot_score":   gorm.Expr(hotScoreFormula),
			"updated_at":  time.Now(),
		}),
	}).Create(map[string]interface{}{
		"book_id":    bookID,
		field:        amount,
		"hot_score":   float64(amount), 
		"updated_at":  time.Now(),
	}).Error
}