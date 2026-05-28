package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"backend-bebu/internal/dto"
	"backend-bebu/internal/services"
	"fmt"
	"github.com/gin-gonic/gin"
)

type UserManagementHandler struct {
	service services.UserManagementService
}

func NewUserManagementHandler(service services.UserManagementService) *UserManagementHandler {
	return &UserManagementHandler{service: service}
}

// GET /api/v1/admin/users
func (h *UserManagementHandler) GetUsersDashboard(c *gin.Context) {
	var filters dto.UserManagementFilterRequest
	
	// Bind query otomatis
	_ = c.ShouldBindQuery(&filters)

	// Fallback Manual jika binding terlewat
	if filters.Search == "" { filters.Search = c.Query("search") }
	if filters.Status == "" { filters.Status = c.Query("status") }
	if filters.Role == "" { filters.Role = c.Query("role") }
	
	if filters.Page <= 0 {
		if p := c.Query("page"); p != "" {
			filters.Page, _ = strconv.Atoi(p)
		} else {
			filters.Page = 1
		}
	}
	if filters.Limit <= 0 {
		filters.Limit = 10
	}

	// Normalisasi filter string
	filters.Status = strings.ToLower(strings.TrimSpace(filters.Status))
	filters.Role = strings.ToLower(strings.TrimSpace(filters.Role))

	res, err := h.service.GetAllUsers(c.Request.Context(), filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

// PUT /api/v1/admin/users/:id/status
func (h *UserManagementHandler) UpdateStatus(c *gin.Context) {
	idStr := c.Param("id")
	userID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user identity ID format."})
		return
	}

	var req dto.UpdateUserStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status must be either 'active', 'suspended', or 'banned'"})
		return
	}

	err = h.service.ModerateUserStatus(c.Request.Context(), uint(userID), req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("User account status successfully transitioned to '%s'.", req.Status),
	})
}