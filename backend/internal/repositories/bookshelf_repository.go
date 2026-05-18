package repositories

import (
	"backend-bebu/internal/models"
	"strings"
	"time"

	"gorm.io/gorm"
)

type BookshelfRepository interface {
	GetBookshelvesByUserID(userID uint, status string, page, limit int) ([]models.UserBookshelf, int64, error)
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

func (r *bookshelfRepository) GetBookshelvesByUserID(userID uint, status string, page, limit int) ([]models.UserBookshelf, int64, error) {
	var bookshelves []models.UserBookshelf
	var total int64
	offset := (page - 1) * limit

	// Buat query dasar
	query := r.db.Model(&models.UserBookshelf{}).Where("user_id = ?", userID)
	
	// Tambahkan filter status jika ada
	if status != "" {
		query = query.Where("shelf_status = ?", status)
	}

	// Hitung total item yang cocok (untuk paginasi)
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Ambil data untuk halaman saat ini dengan Preload yang diperlukan
	err = query.
		Preload("Book.BookAuthors.Author"). // Preload buku dan penulisnya
		Offset(offset).
		Limit(limit).
		Order("updated_at DESC"). // Urutkan berdasarkan yang terakhir diupdate
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