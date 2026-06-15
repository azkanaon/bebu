package handlers

import (
	"net/http"
	"backend-bebu/internal/services"
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