package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
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
	// 1. Siapkan model UserBookshelf untuk disimpan
	newEntry := &models.UserBookshelf{
		UserID:      userID,
		BookID:      req.BookID,
		ShelfStatus: req.ShelfStatus,
	}

	// Tambahkan logika berdasarkan status
	if req.ShelfStatus == "reading" {
		now := time.Now()
		newEntry.StartedAt = &now
	} else if req.ShelfStatus == "done" {
		now := time.Now()
		newEntry.StartedAt = &now // Asumsi jika 'done', pasti sudah pernah 'reading'
		newEntry.FinishedAt = &now
		newEntry.ProgressPercent = new(int)
		*newEntry.ProgressPercent = 100
	}

	// 2. Panggil repository untuk membuat entri
	createdEntry, err := s.bookshelfRepo.AddToBookshelf(newEntry)
	if err != nil {
		// Cek apakah ini error karena duplikat
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" { // 23505 adalah kode untuk unique_violation
			return nil, errors.New("book is already in the bookshelf")
		}
		return nil, err
	}

	createdEntry, err = s.bookshelfRepo.GetBookshelfEntryByID(createdEntry.UserBookshelfID)
	if err != nil {
		return nil, err
	}

	// 4. Mapping ke DTO
	mappedDTO := mapBookshelfToDTO(createdEntry)
	
	return mappedDTO, nil
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
		},
		ShelfStatus: bs.ShelfStatus,
		StartedAt:   bs.StartedAt,
		FinishedAt:  bs.FinishedAt,
	}

    if bs.ProgressPercent != nil {
		dto.Progress = *bs.ProgressPercent
	}
	
	return dto
}

func (s *bookshelfService) UpdateShelfEntry(userID, bookshelfID uint, req *dto.UpdateBookshelfRequestDTO) (*dto.BookshelfItemDTO, error) {
	// 1. Ambil entri bookshelf yang ada dari database
	entry, err := s.bookshelfRepo.FindBookshelfByID(bookshelfID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("bookshelf entry not found")
		}
		return nil, err
	}

	// 2. VERIFIKASI KEPEMILIKAN: Pastikan user yang login adalah pemilik entri ini
	if entry.UserID != userID {
		return nil, errors.New("forbidden: you are not the owner of this bookshelf entry")
	}

	// 3. Terapkan perubahan dari request ke model
	updated := false // Flag untuk mengecek apakah ada perubahan
	if req.ShelfStatus != nil && *req.ShelfStatus != entry.ShelfStatus {
		entry.ShelfStatus = *req.ShelfStatus
		updated = true

		// Logika bisnis tambahan berdasarkan perubahan status
		now := time.Now()
		if entry.ShelfStatus == "reading" && entry.StartedAt == nil {
			entry.StartedAt = &now
		} else if entry.ShelfStatus == "done" {
			if entry.StartedAt == nil {
				entry.StartedAt = &now
			}
			entry.FinishedAt = &now
			entry.ProgressPercent = new(int) // Buat pointer int baru
			*entry.ProgressPercent = 100
		}
	}
	
	// Update progress hanya jika statusnya 'reading'
	if req.ProgressPercent != nil && entry.ShelfStatus == "reading" {
		entry.ProgressPercent = req.ProgressPercent
		updated = true
	}

	// 4. Jika tidak ada perubahan, tidak perlu ke DB.
	if !updated {
		// Kita bisa langsung map dan kembalikan data yang ada
		fullEntry, _ := s.bookshelfRepo.GetBookshelfEntryByID(entry.UserBookshelfID)
		return mapBookshelfToDTO(fullEntry), nil
	}

	// 5. Simpan perubahan ke database
	updatedEntry, err := s.bookshelfRepo.UpdateBookshelf(entry)
	if err != nil {
		return nil, err
	}

	// 6. Ambil data lengkap (dengan preload) dan map ke DTO untuk response
	fullEntry, err := s.bookshelfRepo.GetBookshelfEntryByID(updatedEntry.UserBookshelfID)
	if err != nil {
		return nil, err
	}
	
	return mapBookshelfToDTO(fullEntry), nil
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
			Authors:     authorNames,
		},
		ShelfStatus: bs.ShelfStatus,
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
	// 1. Verifikasi bahwa bookshelf entry ada dan dimiliki oleh user.
	// Gunakan lagi method yang sudah ada.
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

	// 2. Buat objek model Note baru
	newNote := &models.Note{
		UserBookshelfID: bookshelfID,
		PageStart:       req.PageStart,
		PageEnd:         req.PageEnd,
		Description:     req.Description,
	}

	// 3. Simpan note baru ke database
	createdNote, err := s.bookshelfRepo.AddNoteToBookshelf(newNote)
	if err != nil {
		return nil, err
	}
	
	// (Opsional) Update 'updated_at' di UserBookshelf agar rak buku ini muncul paling atas.
	// s.bookshelfRepo.UpdateBookshelf(entry) // Ini akan mengupdate updated_at secara otomatis

	// 4. Mapping ke DTO untuk response
	return &dto.NoteDTO{
		ID:          createdNote.NoteID,
		PageStart:   createdNote.PageStart,
		PageEnd:     createdNote.PageEnd,
		Description: createdNote.Description,
		CreatedAt:   createdNote.CreatedAt,
	}, nil
}

func (s *bookshelfService) UpdateNote(userID, noteID uint, req *dto.UpdateNoteRequestDTO) (*dto.NoteDTO, error) {
	// 1. Ambil catatan yang ada dari database
	note, err := s.bookshelfRepo.FindNoteByID(noteID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("note not found")
		}
		return nil, err
	}

	// 2. VERIFIKASI KEPEMILIKAN
	// Cek apakah UserID dari UserBookshelf yang terkait sama dengan userID dari user yang login.
	if note.UserBookshelf.UserID != userID {
		return nil, errors.New("forbidden: you are not the owner of this note")
	}

	// 3. Terapkan perubahan dari request ke model
	if req.PageStart != nil {
		note.PageStart = req.PageStart
	}
	if req.PageEnd != nil {
		note.PageEnd = req.PageEnd
	}
	if req.Description != nil {
		note.Description = *req.Description
	}

	// 4. Simpan perubahan ke database
	updatedNote, err := s.bookshelfRepo.UpdateNote(note)
	if err != nil {
		return nil, err
	}

	// 5. Mapping ke DTO untuk response
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