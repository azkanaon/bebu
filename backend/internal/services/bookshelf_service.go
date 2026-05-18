package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"backend-bebu/pkg/utils"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BookshelfService interface {
	GetUserBookshelves(viewerID *uint, targetUsername, status string, page, limit int) ([]dto.BookshelfItemDTO, *dto.PaginationDTO, error)
	AddBookToShelf(userID uint, req *dto.AddToBookshelfRequestDTO) (*dto.BookshelfItemDTO, error)
	UpdateShelfEntry(userID, bookshelfID uint, req *dto.UpdateBookshelfRequestDTO) (*dto.BookshelfItemDTO, error)
	DeleteShelfEntry(userID, bookshelfID uint) error
	GetShelfEntryDetail(viewerID *uint, bookshelfID uint) (*dto.BookshelfDetailDTO, error)
	AddNote(userID, bookshelfID uint, req *dto.AddNoteRequestDTO) (*dto.NoteDTO, error)
	UpdateNote(userID, noteID uint, req *dto.UpdateNoteRequestDTO) (*dto.NoteDTO, error)
	DeleteNote(userID, noteID uint) error
	GetReadingStreak(viewerID *uint, username string) (*dto.ReadingStatsDTO, error)
	GetBookshelfNotes(viewerID *uint, bookshelfID uint, noteType string, page, limit int) (*dto.BookshelfNotesResponseDTO, error)
}

type bookshelfService struct {
	db       	*gorm.DB
	bookshelfRepo repositories.BookshelfRepository
	userRepo      repositories.UserRepository // Kita tetap butuh userRepo untuk cek akses!
}

func NewBookshelfService(db *gorm.DB,bookshelfRepo repositories.BookshelfRepository, userRepo repositories.UserRepository) BookshelfService {
	return &bookshelfService{
		db:            db,
		bookshelfRepo: bookshelfRepo,
		userRepo:      userRepo,
	}
}


func (s *bookshelfService) GetUserBookshelves(viewerID *uint, targetUsername, status string, page, limit int) ([]dto.BookshelfItemDTO, *dto.PaginationDTO, error) {
	// 1. Dapatkan data user target
	targetUser, err := s.userRepo.FindByUsername(targetUsername)
	if err != nil {
		// Jika user tidak ditemukan, kembalikan data kosong
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return make([]dto.BookshelfItemDTO, 0), dto.NewPaginationDTO(0, page, limit), nil
		}
		return nil, nil, err // Untuk error database lainnya
	}

	// 2. Lakukan pengecekan akses (blokir, privasi, dll.)
	// Cek status blokir & kepemilikan
	var isBlockedByTarget, isOwnProfile bool
	if viewerID != nil {
		isOwnProfile = (*viewerID == targetUser.UserID)
		if !isOwnProfile {
			// Cek apakah target memblokir saya. Jika ya, akses ditolak.
			isBlockedByTarget, err = s.userRepo.IsBlocked(targetUser.UserID, *viewerID)
			if err != nil {
				return nil, nil, err
			}
			if isBlockedByTarget {
				// Perlakukan seolah-olah user tidak ada
				return make([]dto.BookshelfItemDTO, 0), dto.NewPaginationDTO(0, page, limit), nil
			}
		}
	}

	// Tentukan apakah viewer punya akses ke konten LENGKAP
	var hasFullAccess bool
	isProfilePublic := (targetUser.Settings == nil || targetUser.Settings.IsProfilePublic)

	if isProfilePublic || isOwnProfile {
		hasFullAccess = true
	} else if viewerID != nil {
		// Jika profil privat, cek status follow
		status, err := s.userRepo.GetFollowStatus(*viewerID, targetUser.UserID)
		if err != nil {
			return nil, nil, err
		}
		hasFullAccess = (status == "accepted")
	}

	if !hasFullAccess {
		// Jika tidak punya akses, kembalikan data kosong
		return make([]dto.BookshelfItemDTO, 0), dto.NewPaginationDTO(0, page, limit), nil
	}


	// 3. Jika punya akses, panggil repository untuk mengambil data
	bookshelves, total, err := s.bookshelfRepo.GetBookshelvesByUserID(targetUser.UserID, status, page, limit)
	if err != nil {
		return nil, nil, err
	}

	// 4. Mapping ke DTO
	dtos := make([]dto.BookshelfItemDTO, 0, len(bookshelves)) // Inisialisasi slice dengan kapasitas
	for _, bs := range bookshelves {
		var authorNames []string
		for _, bookAuthor := range bs.Book.BookAuthors {
			authorNames = append(authorNames, bookAuthor.Author.AuthorName)
		}
		
		itemDTO := dto.BookshelfItemDTO{
			// --- PERBAIKAN PUBLIC ID ---
			ID:          bs.UserBookshelfID,
			PublicID:    bs.PublicID, // Langsung gunakan, tanpa .String()
			Book: dto.BookSummaryDTO{
				PublicID:    bs.Book.PublicID, // Langsung gunakan, tanpa .String()
				Title:       bs.Book.Title,
				CoverImgURL: bs.Book.CoverImgURL,
				TotalPages: bs.Book.TotalPages,
				Authors:     authorNames,
			},
			ShelfStatus: bs.ShelfStatus,
			CurrentPage: bs.CurrentPage,
			StartedAt:   bs.StartedAt,
			FinishedAt:  bs.FinishedAt,
		}

		if bs.ProgressPercent != nil {
			itemDTO.Progress = *bs.ProgressPercent
		} else {
			itemDTO.Progress = 0 // Nilai default jika NULL
		}

		dtos = append(dtos, itemDTO)
	}

	// 5. Siapkan metadata paginasi menggunakan helper
	pagination := dto.NewPaginationDTO(total, page, limit)

	return dtos, pagination, nil
}

func (s *bookshelfService) AddBookToShelf(userID uint, req *dto.AddToBookshelfRequestDTO) (*dto.BookshelfItemDTO, error) {
	var bookID uint

	// 1. Mulai Transaksi Database
	err := s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.bookshelfRepo.WithTx(tx)

		// 2. Cek apakah buku sudah ada di database kita berdasarkan GoogleBookID
		existingBook, err := txRepo.FindBookByGoogleID(req.GoogleBookID)
		
		if err == nil {
			// BUKU SUDAH ADA
			bookID = existingBook.BookID
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			// BUKU BELUM ADA, MARI KITA BUAT
			newBook := &models.Book{
				GoogleBookID:    req.GoogleBookID,
				Title:           req.Title,
				Synopsis:        req.Synopsis,
				CoverImgURL:     req.CoverImgURL,
				PublicationYear: req.PublicationYear,
				Language:        req.Language,
				TotalPages:      req.TotalPages,
				Slug:            strings.ToLower(strings.ReplaceAll(req.Title, " ", "-")) + "-" + uuid.New().String()[:8],
			}

			if err := tx.Create(newBook).Error; err != nil {
				return err
			}
			bookID = newBook.BookID

			// A. Proses Authors
			for _, authorName := range req.Authors {
				author, err := txRepo.GetOrCreateAuthor(tx, authorName)
				if err != nil { return err }
				
				// Buat relasi BookAuthor
				tx.Create(&models.BookAuthor{BookID: bookID, AuthorID: author.AuthorID})
			}

			// B. Proses Genres
			for _, genreName := range req.Genres {
				genre, err := txRepo.GetOrCreateGenre(tx, genreName)
				if err != nil { return err }
				
				// Buat relasi BookGenre
				tx.Create(&models.BookGenre{BookID: bookID, GenreID: genre.GenreID})
			}
		} else {
			return err // Error DB lainnya
		}

		// 3. Masukkan ke UserBookshelf
		newEntry := &models.UserBookshelf{
			UserID:      userID,
			BookID:      bookID,
			ShelfStatus: req.ShelfStatus,
		}

		// Logika tanggal & progress otomatis
		if req.ShelfStatus == "reading" {
			now := time.Now(); newEntry.StartedAt = &now
		} else if req.ShelfStatus == "done" {
			now := time.Now(); newEntry.StartedAt = &now; newEntry.FinishedAt = &now
			p := 100; newEntry.ProgressPercent = &p
			newEntry.CurrentPage = req.TotalPages
		}

		// Simpan ke bookshelf (Repo ini harus handle error duplikat book_id + user_id)
		if _, err := txRepo.AddToBookshelf(newEntry); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			return nil, errors.New("book is already in your bookshelf")
		}
		return nil, err
	}

	// 4. Ambil data lengkap untuk response
	fullEntry, err := s.bookshelfRepo.GetBookshelfEntryByUserIDAndBookID(userID, bookID)
	return mapBookshelfToDTO(fullEntry), err
}

func mapBookshelfToDTO(bs *models.UserBookshelf) *dto.BookshelfItemDTO {
	var authorNames []string
	for _, bookAuthor := range bs.Book.BookAuthors {
		if bookAuthor.Author.AuthorID > 0 {
				authorNames = append(authorNames, bookAuthor.Author.AuthorName)
		}
	}
	
	dto := &dto.BookshelfItemDTO{
		ID:          bs.UserBookshelfID,
		PublicID:    bs.PublicID,
		Book: dto.BookSummaryDTO{
			PublicID:    bs.Book.PublicID,
			Title:       bs.Book.Title,
			CoverImgURL: bs.Book.CoverImgURL,
			Authors:     authorNames,
			TotalPages: bs.Book.TotalPages,
		},
		ShelfStatus: bs.ShelfStatus,
		CurrentPage: bs.CurrentPage,
		StartedAt:   bs.StartedAt,
		FinishedAt:  bs.FinishedAt,
	}

    if bs.ProgressPercent != nil {
		dto.Progress = *bs.ProgressPercent
	}
	
	return dto
}

func (s *bookshelfService) UpdateShelfEntry(userID, bookshelfID uint, req *dto.UpdateBookshelfRequestDTO) (*dto.BookshelfItemDTO, error) {
	// 1. Ambil entri bookshelf (Pastikan repository sudah Preload("Book"))
	entry, err := s.bookshelfRepo.FindBookshelfByID(bookshelfID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("bookshelf entry not found")
		}
		return nil, err
	}

	// 2. VERIFIKASI KEPEMILIKAN
	if entry.UserID != userID {
		return nil, errors.New("forbidden: you are not the owner of this bookshelf entry")
	}

	// 3. Gunakan TRANSAKSI agar semua update sinkron
	err = s.db.Transaction(func(tx *gorm.DB) error {
		// A. Logika Perubahan Status (Reading / Done / Want to Read)
		if req.ShelfStatus != nil && *req.ShelfStatus != entry.ShelfStatus {
			entry.ShelfStatus = *req.ShelfStatus
			
			now := time.Now()
			if entry.ShelfStatus == "reading" && entry.StartedAt == nil {
				entry.StartedAt = &now
			} else if entry.ShelfStatus == "done" {
				if entry.StartedAt == nil { entry.StartedAt = &now }
				entry.FinishedAt = &now
				// Jika status 'done', paksa current_page ke maksimal halaman buku
				entry.CurrentPage = entry.Book.TotalPages
			}
		}

		// B. Logika Perubahan Halaman (Manual Input)
		// Jika user input current_page, kita hitung ulang persentasenya
		targetPage := entry.CurrentPage
		if req.CurrentPage != nil {
			targetPage = *req.CurrentPage
		}

		// Jalankan Helper Sync Progress (Menghitung % dan simpan ke DB)
		if err := s.syncProgress(tx, entry, targetPage); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// 4. Ambil data terbaru untuk dikembalikan ke Frontend
	fullEntry, err := s.bookshelfRepo.GetBookshelfEntryByID(bookshelfID)
	return mapBookshelfToDTO(fullEntry), err
}

func (s *bookshelfService) DeleteShelfEntry(userID, bookshelfID uint) error {
	// 1. Ambil entri bookshelf yang ada untuk verifikasi kepemilikan.
	// Kita bisa gunakan lagi method FindBookshelfByID yang sudah ada.
	entry, err := s.bookshelfRepo.FindBookshelfByID(bookshelfID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("bookshelf entry not found")
		}
		return err
	}

	// 2. VERIFIKASI KEPEMILIKAN
	if entry.UserID != userID {
		return errors.New("forbidden: you are not the owner of this bookshelf entry")
	}

	// 3. Panggil repository untuk menghapus entri
	// Kita pass seluruh objek 'entry' yang sudah kita ambil.
	return s.bookshelfRepo.DeleteBookshelfEntry(entry)
}

// --- Implementasi yang diperbarui ---
func (s *bookshelfService) GetShelfEntryDetail(viewerID *uint, bookshelfID uint) (*dto.BookshelfDetailDTO, error) {
	// 1. Ambil data lengkap dari repository, termasuk notes
	// Kita juga butuh info User pemilik untuk cek privasi, jadi kita Preload User.Setting
	entry, err := s.bookshelfRepo.GetBookshelfEntryByID(bookshelfID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("bookshelf entry not found")
		}
		return nil, err
	}
    
    // 2. Lakukan pengecekan akses (blokir, dll.)
    // Dapatkan ID pemilik dari entri bookshelf
    ownerID := entry.UserID
    
    // Cek apakah viewer diblokir oleh pemilik
    if viewerID != nil && *viewerID != ownerID {
        isBlocked, err := s.userRepo.IsBlocked(ownerID, *viewerID) // Menggunakan userRepo
        if err != nil {
            return nil, err
        }
        if isBlocked {
            return nil, errors.New("bookshelf entry not found") // Sembunyikan dengan 404
        }
    }
	
	// 3. LOGIKA PRIVASI (Fleksibel untuk masa depan)
    // Untuk saat ini, kita anggap semua bookshelf bisa dilihat publik.
    // Di masa depan, Anda akan menambahkan pengecekan di sini:
    // isBookshelfPrivate := entry.User.Setting != nil && !entry.User.Setting.IsBookshelfPublic
    // isOwner := viewerID != nil && *viewerID == ownerID
    // if isBookshelfPrivate && !isOwner {
    //     return nil, errors.New("forbidden: this bookshelf is private")
    // }

	// 4. Jika akses diizinkan, mapping ke DTO
	return mapBookshelfToDetailDTO(entry), nil
}

// --- Buat fungsi helper baru untuk mapping ke DTO detail ---
func mapBookshelfToDetailDTO(bs *models.UserBookshelf) *dto.BookshelfDetailDTO {
	// Mapping Author (sama seperti sebelumnya)
	var authorNames []string
	for _, bookAuthor := range bs.Book.BookAuthors {
		if bookAuthor.Author.AuthorID > 0 {
			authorNames = append(authorNames, bookAuthor.Author.AuthorName)
		}
	}
	
	// Mapping Notes
	notesDTO := make([]dto.NoteDTO, 0, len(bs.Notes))
	for _, note := range bs.Notes {
		notesDTO = append(notesDTO, dto.NoteDTO{
			ID:          note.NoteID,
			Type:        note.Type,
			PageStart:   note.PageStart,
			PageEnd:     note.PageEnd,
			Description: note.Description,
			CreatedAt:   note.CreatedAt,
		})
	}
	
	detailDTO := &dto.BookshelfDetailDTO{
		PublicID:    bs.PublicID,
		Book: dto.BookSummaryDTO{
			PublicID:    bs.Book.PublicID,
			Title:       bs.Book.Title,
			CoverImgURL: bs.Book.CoverImgURL,
			TotalPages: bs.Book.TotalPages,
			Authors:     authorNames,
		},
		ShelfStatus: bs.ShelfStatus,
		CurrentPage: bs.CurrentPage,
		StartedAt:   bs.StartedAt,
		FinishedAt:  bs.FinishedAt,
		Notes:       notesDTO, // <-- Sertakan notes yang sudah di-map
	}

    if bs.ProgressPercent != nil {
		detailDTO.Progress = *bs.ProgressPercent
	}
	
	return detailDTO
}

func (s *bookshelfService) AddNote(userID, bookshelfID uint, req *dto.AddNoteRequestDTO) (*dto.NoteDTO, error) {
	// 1. Verifikasi (Query di luar transaksi tidak apa-apa untuk pengecekan awal)
	entry, err := s.bookshelfRepo.FindBookshelfByID(bookshelfID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("bookshelf entry not found")
		}
		return nil, err
	}

	if entry.UserID != userID {
		return nil, errors.New("forbidden: you can only add notes to your own bookshelf entries")
	}

	var createdNote *models.Note

	// 2. Gunakan TRANSAKSI untuk simpan data
	err = s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.bookshelfRepo.WithTx(tx)

		// Simpan note
		newNote := &models.Note{
			UserBookshelfID: bookshelfID,
			Type:            req.Type,
			PageStart:       req.PageStart,
			PageEnd:         req.PageEnd,
			Description:     req.Description,
		}
		
		createdNote, err = txRepo.AddNoteToBookshelf(newNote)
		if err != nil {
			return err
		}

		maxPage, _ := txRepo.GetMaxPageEndFromNotes(tx, bookshelfID)
        if err := s.syncProgress(tx, entry, maxPage); err != nil {
            return err
        }

		// --- PASANG UPDATE STREAK DI SINI ---
		if err := txRepo.UpdateUserStreak(tx, userID); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// 3. Mapping ke DTO
	return &dto.NoteDTO{
		ID:          createdNote.NoteID,
		PageStart:   createdNote.PageStart,
		PageEnd:     createdNote.PageEnd,
		Type:        createdNote.Type,
		Description: createdNote.Description,
		CreatedAt:   createdNote.CreatedAt,
	}, nil
}

func (s *bookshelfService) UpdateNote(userID, noteID uint, req *dto.UpdateNoteRequestDTO) (*dto.NoteDTO, error) {
	// 1. Ambil data & Verifikasi
	note, err := s.bookshelfRepo.FindNoteByID(noteID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("note not found")
		}
		return nil, err
	}

	if note.UserBookshelf.UserID != userID {
		return nil, errors.New("forbidden: you are not the owner of this note")
	}

	var updatedNote *models.Note

	// 2. Gunakan TRANSAKSI
	err = s.db.Transaction(func(tx *gorm.DB) error {
		txRepo := s.bookshelfRepo.WithTx(tx)

		// Terapkan perubahan
		if req.PageStart != nil { note.PageStart = req.PageStart }
		if req.PageEnd != nil { note.PageEnd = req.PageEnd }
		if req.Description != nil { note.Description = *req.Description }

		updatedNote, err = txRepo.UpdateNote(note)
		if err != nil {
			return err
		}

		// --- PASANG UPDATE STREAK DI SINI ---
		// Meskipun hanya update catatan, ini tetap dihitung aktivitas baca aktif
		if err := txRepo.UpdateUserStreak(tx, userID); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &dto.NoteDTO{
		ID:          updatedNote.NoteID,
		PageStart:   updatedNote.PageStart,
		PageEnd:     updatedNote.PageEnd,
		Description: updatedNote.Description,
		CreatedAt:   updatedNote.CreatedAt,
	}, nil
}

func (s *bookshelfService) DeleteNote(userID, noteID uint) error {
	// 1. Ambil catatan yang ada dari database untuk verifikasi kepemilikan.
	// Kita bisa gunakan lagi method FindNoteByID yang sudah ada.
	note, err := s.bookshelfRepo.FindNoteByID(noteID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("note not found")
		}
		return err
	}

	// 2. VERIFIKASI KEPEMILIKAN
	if note.UserBookshelf.UserID != userID {
		return errors.New("forbidden: you are not the owner of this note")
	}

	// 3. Panggil repository untuk menghapus catatan
	return s.bookshelfRepo.DeleteNote(note)
}

func (s *bookshelfService) GetReadingStreak(viewerID *uint, username string) (*dto.ReadingStatsDTO, error) {
	// 1. Cek akses (Gunakan fungsi global di utils)
	targetUser, hasAccess, err := utils.HasProfileAccess(s.userRepo, viewerID, username)
	if err != nil {
		return nil, err
	}
	
	if !hasAccess {
		// Jika profil privat dan tidak di-follow, kita kembalikan stats kosong
		return &dto.ReadingStatsDTO{CurrentStreak: 0, LongestStreak: 0}, nil
	}

	// 2. Ambil data dari repository
	stats, err := s.bookshelfRepo.GetReadingStats(targetUser.UserID)
	if err != nil {
		return nil, err
	}

	// 3. Mapping ke DTO
	return &dto.ReadingStatsDTO{
		CurrentStreak:    stats.CurrentStreak,
		LongestStreak:    stats.LongestStreak,
		LastActivityDate: stats.LastActivityDate,
	}, nil
}

func (s *bookshelfService) syncProgress(tx *gorm.DB, entry *models.UserBookshelf, newPage int) error {
	// 1. Validasi: Jangan sampai melebihi total halaman buku
	if entry.Book.TotalPages > 0 && newPage > entry.Book.TotalPages {
		newPage = entry.Book.TotalPages
	}

	// 2. Hitung Persentase
	var progress int
	if entry.Book.TotalPages > 0 {
		progress = (newPage * 100) / entry.Book.TotalPages
	}

	// 3. Update Model
	entry.CurrentPage = newPage
	entry.ProgressPercent = &progress
    
    // Logika otomatis: Jika progress 100%, set status ke 'done'
    if progress == 100 {
        entry.ShelfStatus = "done"
        now := time.Now()
        entry.FinishedAt = &now
    }

	// 4. Simpan ke DB
	_, err := s.bookshelfRepo.WithTx(tx).UpdateBookshelf(entry)
	return err
}

func (s *bookshelfService) GetBookshelfNotes(viewerID *uint, bookshelfID uint, noteType string, page, limit int) (*dto.BookshelfNotesResponseDTO, error) {
	// 1. Ambil data bookshelf lengkap dengan buku & penulis (untuk header)
	entry, err := s.bookshelfRepo.GetBookshelfEntryByID(bookshelfID)
	if err != nil {
		return nil, err
	}

	// 2. Cek akses privasi menggunakan utilitas global kita
	// Kita butuh username untuk ini
	_, hasAccess, err := utils.HasProfileAccess(s.userRepo, viewerID, entry.User.Username)
	if err != nil {
		return nil, err
	}
	if !hasAccess {
		return nil, errors.New("forbidden: this bookshelf is private")
	}

	// 3. Ambil catatan yang dipaginasi dari repo
	notes, total, err := s.bookshelfRepo.GetNotesByBookshelfID(bookshelfID, noteType, page, limit) // <-- Kirim noteType
	if err != nil {
		return nil, err
	}

	// 4. Mapping Data Penulis untuk Header
	var authorNames []string
	for _, ba := range entry.Book.BookAuthors {
		if ba.Author.AuthorID > 0 {
			authorNames = append(authorNames, ba.Author.AuthorName)
		}
	}

	// 5. Mapping Notes ke DTO
	notesDTO := make([]dto.NoteDTO, 0, len(notes))
	for _, n := range notes {
		notesDTO = append(notesDTO, dto.NoteDTO{
			ID:          n.NoteID,
			Type:        n.Type,
			PageStart:   n.PageStart,
			PageEnd:     n.PageEnd,
			Description: n.Description,
			CreatedAt:   n.CreatedAt,
		})
	}
	progressVal := 0
	if entry.ProgressPercent != nil {
		progressVal = *entry.ProgressPercent
	}
	// 6. Rakit Response Akhir
	return &dto.BookshelfNotesResponseDTO{
		Bookshelf: dto.BookshelfContextDTO{
			Title:       entry.Book.Title,
			Authors:     authorNames,
			CoverImgURL: entry.Book.CoverImgURL,
			Progress:    progressVal,
			CurrentPage: entry.CurrentPage,
			TotalPages: entry.Book.TotalPages,
		},
		Data: notesDTO,
		Meta: dto.NewPaginationDTO(total, page, limit),
	}, nil
}