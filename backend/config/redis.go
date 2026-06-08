package config

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

var redisClient *redis.Client

// ConnectRedis digunakan untuk menginisialisasi koneksi ke Docker Redis
func ConnectRedis() {
	redisClient = redis.NewClient(&redis.Options{
		Addr:     "localhost:6379", // Alamat Docker Redis kamu
		Password: "",               // Kosongkan jika tidak memakai password
		DB:       0,                // Gunakan default DB 0
	})

	// Lakukan ping test untuk memastikan backend benar-benar terhubung ke Redis
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	_, err := redisClient.Ping(ctx).Result()
	if err != nil {
		// Jika gagal connect, log ke terminal agar kamu langsung tahu semenjak awal aplikasi start
		fmt.Printf("[ERROR] Gagal terhubung ke Redis Server: %v\n", err)
	} else {
		fmt.Println("[SUCCESS] Sukses terhubung ke Redis Server di localhost:6379")
	}
}

// GetRedisClient mengembalikan instance redisClient yang sudah terhubung
func GetRedisClient() *redis.Client {
	return redisClient
}