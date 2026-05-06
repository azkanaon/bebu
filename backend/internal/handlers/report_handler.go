package handlers

import (
	"net/http"
	"backend-bebu/internal/services"
	"github.com/gin-gonic/gin"
	"fmt"
)

type ReportHandler struct {
	service services.ReportService
}

func NewReportHandler(service services.ReportService) *ReportHandler {
	return &ReportHandler{service}
}

type ReportRequest struct {
	EntityID   int    `json:"entity_id" binding:"required"`
	EntityType string `json:"entity_type" binding:"required"`
	Reason     string `json:"reason_text" binding:"required"` // Kategori pilihan user
}

func (h *ReportHandler) CreateReport(c *gin.Context) {
	var req ReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Println("Error Binding:", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ambil UserID dari middleware Auth (sesuaikan dengan implementasi Anda)
	// Misal: userID := c.MustGet("userID").(uint)
	userID := uint(1) // Placeholder untuk testing

	err := h.service.ReportEntity(userID, req.EntityID, req.EntityType, req.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Laporan berhasil dikirim, terima kasih atas masukan Anda."})
}