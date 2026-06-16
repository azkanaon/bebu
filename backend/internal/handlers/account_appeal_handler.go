package handlers

import (
	"net/http"
	"strconv"
	
	"backend-bebu/internal/services"
	"backend-bebu/internal/dto"
	"backend-bebu/internal/utils"

	"github.com/gin-gonic/gin"
)

type AccountAppealHandler struct {
	appealService services.AccountAppealService
}

func NewAccountAppealHandler(appealService services.AccountAppealService) *AccountAppealHandler {
	return &AccountAppealHandler{appealService: appealService}
}

func (h *AccountAppealHandler) AddAppeal(c *gin.Context) {
	// 1. Ambil UserID dari middleware Auth
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Akses ditolak, user tidak terautentikasi"})
		return
	}
	userID := userIDVal.(uint)

	// 2. Membaca data teks dari Form Data (Bukan JSON lagi karena mengirim berkas biner)
	appealReason := c.PostForm("appeal_reason")
	
	// 3. Memproses berkas gambar opsional ("evidence_image")
	var evidenceURL *string
	file, err := c.FormFile("evidence_image")

	// Jika berkas disediakan, buka stream-nya dan upload
	if err == nil && file != nil {
		// 💡 Buka file stream untuk mendapatkan type multipart.File yang diinginkan oleh utils Anda
		src, openErr := file.Open()
		if openErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuka file gambar bukti"})
			return
		}
		defer src.Close()

		// 💡 Panggil utils dengan 1 argumen sesuai keinginan 'want (multipart.File)' compiler Anda
		url, uploadErr := utils.UploadToCloudinary(src) 
		if uploadErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengunggah gambar bukti ke Cloudinary"})
			return
		}
		evidenceURL = &url
	}

	// 4. Menyusun DTO Request untuk dikirim ke Service Layer
	req := services.CreateAppealRequest{
		AppealReason: appealReason,
		EvidenceURL:  evidenceURL,
	}

	// 5. Eksekusi ke Service layer
	appeal, err := h.appealService.SubmitAppeal(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 6. Kembalikan response sukses standar profesional
	c.JSON(http.StatusCreated, gin.H{
		"message": "Pengajuan banding berhasil dikirim. Akun Anda akan ditinjau kembali oleh admin.",
		"data":    appeal,
	})
}

// GetAllAppeals digunakan oleh Admin untuk mendapatkan data baris tabel
func (h *AccountAppealHandler) GetAllAppeals(c *gin.Context) {
	appeals, err := h.appealService.GetAppealsForAdmin(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar banding admin"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": appeals})
}

// GetAppealDetail digunakan ketika admin membuka pop-up modal review
func (h *AccountAppealHandler) GetAppealDetail(c *gin.Context) {
	idParam := c.Param("id")
	appealID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID pengajuan banding tidak valid"})
		return
	}

	detail, err := h.appealService.GetAppealDetailForAdmin(c.Request.Context(), uint(appealID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memuat detail data banding"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": detail})
}

// HandleAppealAction dipicu saat admin menekan tombol "Terima" atau "Tolak" di dalam modal
func (h *AccountAppealHandler) HandleAppealAction(c *gin.Context) {
	idParam := c.Param("id")
	appealID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID pengajuan banding tidak valid"})
		return
	}

	// Ambil Admin ID dari JWT Token / Auth Middleware Admin
	adminIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Akses admin ditolak, sesi tidak valid"})
		return
	}
	adminID := adminIDVal.(uint)

	var req dto.ActionAppealRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.appealService.ProcessAppealAction(c.Request.Context(), uint(appealID), adminID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Keputusan banding berhasil disimpan dan status akun pengguna telah diperbarui"})
}