package utils

import (
	"fmt"
	"time"

	"backend-bebu/config" // Import config Anda

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// GenerateJWT membuat token baru.
// Kita pindahkan dari auth_service dan buat jadi publik.
func GenerateJWT(userPublicID uuid.UUID) (string, error) {
	expirationTime := time.Now().Add(time.Duration(config.JWTExpirationInMinutes) * time.Minute)

	claims := &jwt.RegisteredClaims{
		Subject:   userPublicID.String(),
		ExpiresAt: jwt.NewNumericDate(expirationTime),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(config.JWTSecretKey))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateToken memverifikasi token dan mengambil claims-nya.
func ValidateToken(tokenString string) (*jwt.RegisteredClaims, error) {
	claims := &jwt.RegisteredClaims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(config.JWTSecretKey), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}