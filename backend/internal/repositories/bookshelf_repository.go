package repositories

import (
	"backend-bebu/internal/models"

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
	FindNoteByID(noteID uint) (*models.Note, error)
	UpdateNote(note *models.Note) (*models.Note, error)
	DeleteNote(note *models.Note) error
}

type bookshelfRepository struct {
	db *gorm.DB
}

func NewBookshelfRepository(db *gorm.DB) BookshelfRepository {
	return &bookshelfRepository{db: db}
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
	err := r.db.First(&entry, id).Error
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