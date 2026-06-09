package handlers

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/services"
	"encoding/json"
	"errors"
	"mime/multipart"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// UserHandler adalah struct yang akan menampung semua method handler terkait user.
// Dia butuh UserService untuk bekerja.
type UserHandler struct {
	userService services.UserService
}

// NewUserHandler adalah "pabrik" untuk membuat UserHandler baru.
func NewUserHandler(userService services.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// GetUserProfile adalah method yang akan di-bind ke rute GET /users/:username
func (h *UserHandler) GetUserProfile(c *gin.Context) {
	// 1. Ambil username dari parameter URL
	username := c.Param("username")

	// 2. Ambil ID user yang sedang login (viewer) dari context.
	// Ini diasumsikan sudah di-set oleh middleware otentikasi.
	// Kita buat ini opsional, jadi kita pakai pointer.
	var viewerID *uint
	id, exists := c.Get("userID") // "userID" adalah key yang kita set di middleware

	if exists {
		if castedID, ok := id.(uint); ok {
			viewerID = &castedID
		}
	}

	// 3. Panggil service untuk melakukan semua pekerjaan berat
	profile, err := h.userService.GetProfileByUsername(username, viewerID)

	// 4. Handle hasilnya (error atau sukses)
	if err != nil {
		// Kita cek jenis error-nya agar bisa memberi response HTTP yang tepat.
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Jika service mengembalikan error "record not found", artinya user tidak ada.
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		// Untuk semua error lainnya, kita anggap sebagai internal server error.
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user profile"})
		return
	}

	// 5. Jika sukses, kirim response JSON dengan data DTO dari service.
	c.JSON(http.StatusOK, gin.H{"data": profile})
}

func (h *UserHandler) GetMyProfile(c *gin.Context) {
    // 1. Ambil userID dari context (hasil set dari middleware)
    uid, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "User context not found"})
        return
    }

    // 2. Panggil service (casting uid ke uint)
    user, err := h.userService.GetMyProfile(uid.(uint))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch profile"})
        return
    }

    // 3. Kembalikan data user
    c.JSON(http.StatusOK, user)
}

// FollowUser adalah handler untuk endpoint POST /users/:username/follow
func (h *UserHandler) FollowUser(c *gin.Context) {
	// ... (langkah 1 & 2: ambil targetUsername dan sourceUserIDUint, tetap sama) ...
	targetUsername := c.Param("username")
    sourceUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Lakukan type assertion dengan aman
	sourceUserIDUint, ok := sourceUserID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID in context is not of expected type"})
		return
	}

	// 3. Panggil service untuk menjalankan logika
	// Service sekarang mengembalikan string status
	status, err := h.userService.FollowUser(sourceUserIDUint, targetUsername)

	// 4. Handle response berdasarkan hasil dari service
	if err != nil {
		// ... (penanganan error tetap sama) ...
        if err.Error() == "user to follow not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "cannot follow yourself" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}) 
		return
	}

	// 5. Jika sukses, kirim response yang berisi status
	c.JSON(http.StatusOK, gin.H{
		"message": "Follow request processed successfully",
		"status":  status, // "accepted" atau "pending"
	})
}

// UnfollowUser adalah handler untuk endpoint DELETE /users/:username/follow
func (h *UserHandler) UnfollowUser(c *gin.Context) {
	// Langkah 1 & 2 sama seperti FollowUser
	targetUsername := c.Param("username")

	sourceUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user from context"})
		return
	}
	sourceUserIDUint, ok := sourceUserID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID in context is not of expected type"})
		return
	}

	// 3. Panggil service
	err := h.userService.UnfollowUser(sourceUserIDUint, targetUsername)

	// 4. Handle response
	if err != nil {
		if err.Error() == "user to unfollow not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unfollow user"})
		return
	}

	// 5. Jika sukses
	c.JSON(http.StatusOK, gin.H{"message": "Successfully unfollowed " + targetUsername})
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	// 1. Dapatkan userID dari context (dari middleware RequiredAuth)
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

	// 2. Siapkan DTO untuk menampung data dari request
	var req dto.UpdateProfileRequestDTO

	// 3. Parsing data dari multipart/form-data
	
	// Data Teks Biasa (DisplayName, Bio, Location)
	// Kita gunakan pointer agar bisa membedakan antara string kosong dan field yang tidak dikirim.
	if val, ok := c.GetPostForm("display_name"); ok {
		req.DisplayName = &val
	}
	if val, ok := c.GetPostForm("bio"); ok {
		req.Bio = &val
	}
	if val, ok := c.GetPostForm("location"); ok {
		req.Location = &val
	}
	if val, ok := c.GetPostForm("gender"); ok { // <-- TAMBAHKAN BLOK INI
		req.Gender = &val
	}

	// Data Boolean (IsProfilePublic, AllowDmFromPublic)
	// Form value selalu string ("true", "false"), jadi kita perlu parse.
	if val, ok := c.GetPostForm("is_profile_public"); ok {
		b, err := strconv.ParseBool(val)
		if err == nil {
			req.IsProfilePublic = &b
		}
	}

	if val, ok := c.GetPostForm("is_bookshelf_public"); ok {
		b, err := strconv.ParseBool(val)
		if err == nil {
			req.IsBookshelfPublic = &b
		}
	}

	if val, ok := c.GetPostForm("allow_dm_from_public"); ok {
		b, err := strconv.ParseBool(val)
		if err == nil {
			req.AllowDmFromPublic = &b
		}
	}

	// Data Social Links (dikirim sebagai string JSON)
	if socialLinksJSON, ok := c.GetPostForm("social_links"); ok {
		var socialLinks []dto.SocialLinkInputDTO
		if err := json.Unmarshal([]byte(socialLinksJSON), &socialLinks); err == nil {
			req.SocialLinks = socialLinks
		} else {
			// Jika JSON tidak valid, kita bisa mengembalikan error atau mengabaikannya.
			// Mengembalikan error lebih baik agar frontend tahu ada masalah.
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid format for socialLinks"})
			return
		}
	}
	if val, ok := c.GetPostForm("remove_avatar"); ok {
		b, err := strconv.ParseBool(val)
		if err == nil {
			req.RemoveAvatar = &b
		}
	}
	// Data File (Avatar)
	var avatarFile *multipart.FileHeader
	file, err := c.FormFile("avatar")
	if err == nil {
		avatarFile = file
	} else if err != http.ErrMissingFile {
		// Jika error bukan karena file tidak ada, berarti ada masalah lain
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to process avatar file"})
		return
	}

	// 4. Panggil Service dengan data yang sudah di-parse
	updatedProfile, err := h.userService.UpdateProfile(userIDUint, &req, avatarFile)
	if err != nil {
		// Anda bisa menambahkan penanganan error yang lebih spesifik di sini
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 5. Kirim response sukses
	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"data":    updatedProfile,
	})
}

func (h *UserHandler) GetFollowRequests(c *gin.Context) {
	// 1. Ambil ID user dari context (Pola Aman)
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	currentUserID := userIDValue.(uint)

	// 2. Parse parameter paginasi dari query string
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 { page = 1 }
	
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 { limit = 20 }

	// 3. Panggil service
	requests, pagination, err := h.userService.GetFollowRequests(currentUserID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch follow requests"})
		return
	}

	// 4. Kirim response dengan format data & meta
	c.JSON(http.StatusOK, gin.H{
		"data": requests,
		"meta": pagination,
	})
}


// AcceptFollowRequest adalah handler untuk POST /follow-requests/:username/accept
func (h *UserHandler) AcceptFollowRequest(c *gin.Context) {
	// 1. Ambil username user yang permintaannya akan diterima (dari URL)
	requesterUsername := c.Param("username")

	// 2. Ambil ID user yang sedang login (yang menerima/menolak)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	currentUserID, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID in context"})
		return
	}

	// 3. Panggil service untuk memproses penerimaan
	err := h.userService.AcceptFollowRequest(currentUserID, requesterUsername)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Follow request not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to accept follow request"})
		return
	}

	// 4. Kirim response sukses
	c.JSON(http.StatusOK, gin.H{"message": "Follow request accepted successfully"})
}


// DeclineFollowRequest adalah handler untuk DELETE /follow-requests/:username/decline
func (h *UserHandler) DeclineFollowRequest(c *gin.Context) {
	// Langkah 1 & 2 sama seperti Accept
	requesterUsername := c.Param("username")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	currentUserID, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID in context"})
		return
	}

	// 3. Panggil service untuk memproses penolakan
	err := h.userService.DeclineFollowRequest(currentUserID, requesterUsername)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Follow request not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decline follow request"})
		return
	}

	// 4. Kirim response sukses
	c.JSON(http.StatusOK, gin.H{"message": "Follow request declined successfully"})
}

func (h *UserHandler) BlockUser(c *gin.Context) {
	// 1. Ambil username target dari URL
	targetUsername := c.Param("username")

	// 2. Ambil ID user yang melakukan aksi (source) dari context dengan aman
	sourceUserIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	sourceUserID, ok := sourceUserIDValue.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID in context"})
		return
	}

	// 3. Panggil service untuk menjalankan logika block
	err := h.userService.BlockUser(sourceUserID, targetUsername)

	// 4. Handle response berdasarkan hasil dari service
	if err != nil {
		// Cek error spesifik yang didefinisikan di service
		if err.Error() == "user to block not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "cannot block yourself" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}) // 400 Bad Request karena ini adalah aksi yang tidak valid dari sisi klien
			return
		}

		// Untuk semua error tak terduga lainnya
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to block user"})
		return
	}

	// 5. Jika sukses
	c.JSON(http.StatusOK, gin.H{"message": "Successfully blocked " + targetUsername})
}

// UnblockUser adalah handler untuk DELETE /users/:username/block
func (h *UserHandler) UnblockUser(c *gin.Context) {
	// 1. Ambil username target dari URL
	targetUsername := c.Param("username")

	// 2. Ambil ID user yang melakukan aksi (source) dari context dengan aman
	sourceUserIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	sourceUserID, ok := sourceUserIDValue.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID in context"})
		return
	}

	err := h.userService.UnblockUser(sourceUserID, targetUsername)

	if err != nil {
		if err.Error() == "user to unblock not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "You are not blocking this user"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unblock user"})
		return
	}

	// 5. Jika sukses
	c.JSON(http.StatusOK, gin.H{"message": "Successfully unblocked " + targetUsername})
}

func (h *UserHandler) SearchUsers(c *gin.Context) {
    query := c.Query("q")
    
    // Ambil ID user yang sedang login dari context
    val, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
        return
    }
    currentUserID := val.(uint)

    if query == "" {
        c.JSON(http.StatusOK, gin.H{"data": []interface{}{}})
        return
    }

    // Kirim currentUserID ke service
    users, err := h.userService.SearchUsers(query, currentUserID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mencari user"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "status": "success",
        "data":   users,
    })
}

func (h *UserHandler) GetFollowers(c *gin.Context) {
	// Parsing username, page, limit, dan viewerID (sama seperti GetUserPosts)
	username := c.Param("username")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	viewerID := getViewerID(c) // Asumsi ada helper getViewerID

	// Panggil service yang sesuai
	followers, pagination, err := h.userService.GetFollowerList(viewerID, username, page, limit)
	if err != nil { /* ... handle error ... */ }

	c.JSON(http.StatusOK, gin.H{"data": followers, "meta": pagination})
}

func (h *UserHandler) GetFollowing(c *gin.Context) {
	username := c.Param("username")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	viewerID := getViewerID(c)

	following, pagination, err := h.userService.GetFollowingList(viewerID, username, page, limit)
	if err != nil { /* ... handle error ... */ }

	c.JSON(http.StatusOK, gin.H{"data": following, "meta": pagination})
}

func getViewerID(c *gin.Context) *uint {
	idValue, exists := c.Get("userID")
	if !exists {
		return nil
	}
	
	id, ok := idValue.(uint)
	if !ok {
		return nil
	}
	
	return &id
}

