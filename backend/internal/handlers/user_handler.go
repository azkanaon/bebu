package handlers

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "backend-bebu/config"
    "backend-bebu/internal/models"
)

type UserResponse struct {
    ID       uint   `json:"id"`
    Email    string `json:"email"`
    Role     string `json:"role"`
    Name     string `json:"name"`
    Username string `json:"username"`
    Avatar   string `json:"avatar"`
}

func GetCurrentUser(c *gin.Context) {
    // sementara hardcode dulu
    userID := 1

    var user models.User

    err := config.DB.Preload("Profile").First(&user, userID).Error
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed"})
        return
    }

    response := UserResponse{
        ID:       user.UserID,
        Email:    user.Email,
        Role:     user.Role,
        Username: user.Username,
        Name:     user.Profile.DisplayName,
        Avatar:   user.Profile.AvatarUrl,
    }

    // fallback avatar
    if response.Avatar == "" {
        response.Avatar = "https://i.pravatar.cc/150"
    }

    c.JSON(http.StatusOK, response)
}