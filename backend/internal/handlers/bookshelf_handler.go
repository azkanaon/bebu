package handlers

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type BookshelfHandler struct {
	bookshelfService services.BookshelfService
}

func NewBookshelfHandler(bookshelfService services.BookshelfService) *BookshelfHandler {
	return &BookshelfHandler{bookshelfService: bookshelfService}
}

func (h *BookshelfHandler) GetUserBookshelves(c *gin.Context) {
	// 1. Ambil path parameter
	username := c.Param("username")
	status := c.Query("status")
	search := c.Query("q") 

	// Ambil 'page' dengan nilai default 1
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	// Ambil 'limit' dengan nilai default 20
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if err != nil || limit < 1 {
		limit = 20
	}
	// Anda bisa menambahkan batas maksimal untuk limit, misal 100
	if limit > 100 {
		limit = 100
	}

	// 3. Ambil viewerID dari context (opsional)
	var viewerID *uint
	if id, exists := c.Get("userID"); exists {
		if castedID, ok := id.(uint); ok {
			viewerID = &castedID
		}
	}

	// 4. Panggil service
	bookshelves, pagination, err := h.bookshelfService.GetUserBookshelves(viewerID, username, status, search, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookshelves"})
		return
	}

	// 5. Kirim response JSON dengan format data dan meta
	c.JSON(http.StatusOK, gin.H{
		"data": bookshelves,
		"meta": pagination,
	})
}

// AddToBookshelf adalah handler untuk POST /bookshelves
func (h *BookshelfHandler) AddToBookshelf(c *gin.Context) {
	// 1. Ambil userID dari context (dari middleware RequiredAuth)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userIDUint, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID in context"})
		return
	}

	// 2. Bind dan validasi JSON body ke DTO
	var req dto.AddToBookshelfRequestDTO
	// c.ShouldBindJSON akan otomatis menggunakan validator 'binding' di DTO kita.
	if err := c.ShouldBindJSON(&req); err != nil {
		// Jika validasi gagal (misal: field kosong atau status tidak valid),
		// Gin akan memberikan error yang cukup deskriptif.
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3. Panggil service untuk menambahkan buku ke rak
	newBookshelfEntry, err := h.bookshelfService.AddBookToShelf(userIDUint, &req)
	if err != nil {
		// Handle error spesifik dari service
		if err.Error() == "book is already in the bookshelf" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()}) // 409 Conflict lebih cocok untuk duplikat
			return
		}
		// Handle error lain
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add book to bookshelf"})
		return
	}

	// 4. Kirim response sukses dengan data yang baru dibuat
	c.JSON(http.StatusCreated, gin.H{ // 201 Created lebih cocok untuk resource baru
		"message": "Book added to bookshelf successfully",
		"data":    newBookshelfEntry,
	})
}

// UpdateBookshelfEntry adalah handler untuk PUT /bookshelves/:id
func (h *BookshelfHandler) UpdateBookshelfEntry(c *gin.Context) {
	// 1. Ambil userID dari context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userIDUint, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID in context"})
		return
	}

	// 2. Ambil bookshelf_id dari parameter URL
	bookshelfIDStr := c.Param("id")
	bookshelfID, err := strconv.ParseUint(bookshelfIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bookshelf ID format"})
		return
	}

	// 3. Bind dan validasi JSON body ke DTO
	var req dto.UpdateBookshelfRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 4. Panggil service untuk melakukan update
	updatedEntry, err := h.bookshelfService.UpdateShelfEntry(userIDUint, uint(bookshelfID), &req)
	if err != nil {
		// Handle error spesifik dari service
		if err.Error() == "bookshelf entry not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "forbidden: you are not the owner of this bookshelf entry" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()}) // 403 Forbidden lebih cocok untuk masalah kepemilikan
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update bookshelf entry"})
		return
	}

	// 5. Kirim response sukses
	c.JSON(http.StatusOK, gin.H{
		"message": "Bookshelf entry updated successfully",
		"data":    updatedEntry,
	})
}

func (h *BookshelfHandler) DeleteFromBookshelf(c *gin.Context) {
	// 1. Ambil userID dari context
	userID, exists := c.Get("userID")
	if !exists { /* ... handle error ... */ }
	userIDUint, ok := userID.(uint)
	if !ok { /* ... handle error ... */ }

	// 2. Ambil bookshelf_id dari parameter URL
	bookshelfIDStr := c.Param("id")
	bookshelfID, err := strconv.ParseUint(bookshelfIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bookshelf ID format"})
		return
	}

	// 3. Panggil service untuk melakukan penghapusan
	err = h.bookshelfService.DeleteShelfEntry(userIDUint, uint(bookshelfID))
	if err != nil {
		if err.Error() == "bookshelf entry not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "forbidden: you are not the owner of this bookshelf entry" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete bookshelf entry"})
		return
	}

	// 4. Kirim response sukses
	// Status 204 No Content juga umum untuk DELETE, tapi 200 OK dengan pesan juga baik.
	c.JSON(http.StatusOK, gin.H{"message": "Book removed from bookshelf successfully"})
}

func (h *BookshelfHandler) GetBookshelfEntryDetail(c *gin.Context) {
	// 1. Ambil bookshelf_id dari parameter URL
	bookshelfIDStr := c.Param("id")
	bookshelfID, err := strconv.ParseUint(bookshelfIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bookshelf ID format"})
		return
	}

	// 2. Ambil viewerID dari context (opsional, karena endpoint ini publik)
	var viewerID *uint
	if id, exists := c.Get("userID"); exists {
		if castedID, ok := id.(uint); ok {
			viewerID = &castedID
		}
	}

	// 3. Panggil service untuk mendapatkan detail
	detail, err := h.bookshelfService.GetShelfEntryDetail(viewerID, uint(bookshelfID))
	if err != nil {
		if err.Error() == "bookshelf entry not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		// Kita tidak mengekspos error "forbidden" secara spesifik untuk keamanan,
		// biarkan terlihat seperti not found.
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookshelf entry detail"})
		return
	}

	// 4. Kirim response sukses
	c.JSON(http.StatusOK, gin.H{"data": detail})
}

func (h *BookshelfHandler) AddNote(c *gin.Context) {
	// 1. Ambil userID dari context (dengan cara yang aman)
	userIDValue, exists := c.Get("userID")
	if !exists {
		// Middleware RequiredAuth seharusnya sudah mencegah ini, tapi ini adalah pengaman
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, ok := userIDValue.(uint)
	if !ok {
		// Tipe data di context tidak sesuai, ini adalah error server internal
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format in context"})
		return
	}

	// 2. Ambil bookshelf_id dari URL
	bookshelfIDStr := c.Param("id")
	bookshelfID, err := strconv.ParseUint(bookshelfIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bookshelf ID format"})
		return
	}

	// 3. Bind dan validasi JSON body
	var req dto.AddNoteRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 4. Panggil service
	newNote, err := h.bookshelfService.AddNote(userID, uint(bookshelfID), &req)
	if err != nil {
		if err.Error() == "bookshelf entry not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "forbidden: you can only add notes to your own bookshelf entries" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add note"})
		return
	}

	// 5. Kirim response sukses
	c.JSON(http.StatusCreated, gin.H{
		"message": "Note added successfully",
		"data":    newNote,
	})
}

func (h *BookshelfHandler) UpdateNote(c *gin.Context) {
	// 1. Ambil userID dari context dengan aman
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, ok := userIDValue.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format in context"})
		return
	}

	// 2. Ambil note_id dari parameter URL dan validasi formatnya
	noteIDStr := c.Param("id")
	noteID, err := strconv.ParseUint(noteIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note ID format"})
		return
	}

	// 3. Bind dan validasi JSON body dari request
	var req dto.UpdateNoteRequestDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 4. Panggil service untuk melakukan logika update
	updatedNote, err := h.bookshelfService.UpdateNote(userID, uint(noteID), &req)
	if err != nil {
		// Handle error-error spesifik yang dikembalikan oleh service
		if err.Error() == "note not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "forbidden: you are not the owner of this note" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		// Untuk semua error tak terduga lainnya
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update note"})
		return
	}

	// 5. Jika semuanya berhasil, kirim response sukses
	c.JSON(http.StatusOK, gin.H{
		"message": "Note updated successfully",
		"data":    updatedNote,
	})
}

func (h *BookshelfHandler) DeleteNote(c *gin.Context) {
	// 1. Ambil userID dari context dengan aman
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, ok := userIDValue.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format in context"})
		return
	}

	// 2. Ambil note_id dari parameter URL dan validasi formatnya
	noteIDStr := c.Param("id")
	noteID, err := strconv.ParseUint(noteIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note ID format"})
		return
	}

	// 3. Panggil service untuk melakukan logika penghapusan
	err = h.bookshelfService.DeleteNote(userID, uint(noteID))
	if err != nil {
		// Handle error-error spesifik yang dikembalikan oleh service
		if err.Error() == "note not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "forbidden: you are not the owner of this note" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		// Untuk semua error tak terduga lainnya
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete note"})
		return
	}

	// 4. Jika semuanya berhasil, kirim response sukses
	c.JSON(http.StatusOK, gin.H{"message": "Note deleted successfully"})
}

func (h *BookshelfHandler) GetReadingStreak(c *gin.Context) {
	username := c.Param("username")
	
	// Ambil viewerID dari context (OptionalAuth)
	var viewerID *uint
	if id, exists := c.Get("userID"); exists {
		if castedID, ok := id.(uint); ok {
			viewerID = &castedID
		}
	}

	stats, err := h.bookshelfService.GetReadingStreak(viewerID, username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch reading stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": stats})
}

func (h *BookshelfHandler) GetBookshelfNotes(c *gin.Context) {
	bookshelfID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	noteType := c.Query("type")
	var viewerID *uint
	if id, exists := c.Get("userID"); exists {
		uid := id.(uint)
		viewerID = &uid
	}

	res, err := h.bookshelfService.GetBookshelfNotes(viewerID, uint(bookshelfID), noteType, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}