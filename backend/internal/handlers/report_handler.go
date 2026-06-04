package handlers

import (
	"net/http"
	"backend-bebu/internal/services"
	"backend-bebu/internal/dto"
	"github.com/gin-gonic/gin"
	"fmt"
	"strconv"
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
	Reason     string `json:"reason_text" binding:"required"` 
}

func (h *ReportHandler) CreateReport(c *gin.Context) {
	var req ReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Println("Error Binding:", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ✅ Ambil userID yang sedang login dari Gin Context (Set dari Auth Middleware Anda)
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

	// Kirim userID hasil login yang valid ke service
	err := h.service.ReportEntity(userID, req.EntityID, req.EntityType, req.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Laporan berhasil dikirim, terima kasih atas masukan Anda."})
}

// Report Summary
func (h *ReportHandler) GetReportDashboard(c *gin.Context) {
	var filters dto.ReportFilterRequest
	// ShouldBindQuery akan otomatis memetakan query param seperti ?page=2&search=kamal
	if err := c.ShouldBindQuery(&filters); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.service.GetReports(c.Request.Context(), filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

/* --- REPORT SUMMARY DETAIL --- */
func (h *ReportHandler) GetPopUpDetail(c *gin.Context) {
	// Ambil summary id dari path param
	idParam := c.Param("id")
	summaryID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid report summary ID format"})
		return
	}

	data, err := h.service.GetSummaryPopUpDetail(uint(summaryID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Detail report fetched successfully",
		"data":    data,
	})
}

/* --- ADMIN ACTION --- */
func (h *ReportHandler) TakeAction(c *gin.Context) {
	// Mendapatkan Admin ID dari JWT Middleware Context Token Anda
	adminIDVal, exists := c.Get("userID") 
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized administrative session"})
		return
	}
	adminID := adminIDVal.(uint)

	var req dto.AdminActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.service.ProcessAction(c.Request.Context(), adminID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}