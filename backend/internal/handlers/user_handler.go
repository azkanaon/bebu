package handlers

import (
	"backend-bebu/internal/services" // Handler butuh service
	"encoding/json"                  // <-- Tambahkan import ini untuk unmarshal socialLinks
	"errors"
	"mime/multipart" // <-- Tambahkan import ini untuk file
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


// FollowUser adalah handler untuk endpoint POST /users/:username/follow
func (h *UserHandler) FollowUser(c *gin.Context) {
	// 1. Ambil username target dari URL
	targetUsername := c.Param("username")

	// 2. Ambil ID user yang melakukan aksi (source) dari context.
	// Ini adalah rute yang dilindungi, jadi kita 100% yakin "userID" ada.
	sourceUserID, exists := c.Get("userID")
	if !exists {
		// Seharusnya tidak akan pernah terjadi jika middleware RequiredAuth bekerja
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user from context"})
		return
	}

	// Lakukan type assertion
	sourceUserIDUint, ok := sourceUserID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID in context is not of expected type"})
		return
	}

	// 3. Panggil service untuk menjalankan logika
	err := h.userService.FollowUser(sourceUserIDUint, targetUsername)

	// 4. Handle response berdasarkan hasil dari service
	if err != nil {
		// Cek jenis error spesifik yang kita definisikan di service
		if err.Error() == "user to follow not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "cannot follow yourself" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// Untuk error lainnya
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to follow user"})
		return
	}

	// 5. Jika sukses
	c.JSON(http.StatusOK, gin.H{"message": "Successfully followed " + targetUsername})
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
	var req services.UpdateProfileRequestDTO

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
	if val, ok := c.GetPostForm("allow_dm_from_public"); ok {
		b, err := strconv.ParseBool(val)
		if err == nil {
			req.AllowDmFromPublic = &b
		}
	}

	// Data Social Links (dikirim sebagai string JSON)
	if socialLinksJSON, ok := c.GetPostForm("social_links"); ok {
		var socialLinks []services.SocialLinkInputDTO
		if err := json.Unmarshal([]byte(socialLinksJSON), &socialLinks); err == nil {
			req.SocialLinks = socialLinks
		} else {
			// Jika JSON tidak valid, kita bisa mengembalikan error atau mengabaikannya.
			// Mengembalikan error lebih baik agar frontend tahu ada masalah.
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid format for socialLinks"})
			return
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







// package handlers

// import (
//     "net/http"

//     "github.com/gin-gonic/gin"
//     "backend-bebu/config"
//     "backend-bebu/internal/models"
// )

// type UserResponse struct {
//     ID       uint   `json:"id"`
//     Email    string `json:"email"`
//     Role     string `json:"role"`
//     Name     string `json:"name"`
//     Username string `json:"username"`
//     Avatar   string `json:"avatar"`
// }

// func GetCurrentUser(c *gin.Context) {
//     // sementara hardcode dulu
//     userID := 1

//     var user models.User

//     err := config.DB.Preload("Profile").First(&user, userID).Error
//     if err != nil {
//         c.JSON(http.StatusInternalServerError, gin.H{"error": "failed"})
//         return
//     }

//     response := UserResponse{
//         ID:       user.UserID,
//         Email:    user.Email,
//         Role:     user.Role,
//         Username: user.Username,
//         Name:     user.Profile.DisplayName,
//         Avatar:   user.Profile.AvatarUrl,
//     }

//     // fallback avatar
//     if response.Avatar == "" {
//         response.Avatar = "https://i.pravatar.cc/150"
//     }

//     c.JSON(http.StatusOK, response)
// }