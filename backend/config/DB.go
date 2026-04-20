package config

import(
	"log"
    "os"
    "strconv"
    "github.com/joho/godotenv"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

var DB *gorm.DB
var JWTSecretKey string 
var JWTExpirationInMinutes int 

func LoadAndConnectDB() {
    // Load .env
    err := godotenv.Load()
    if err != nil {
        log.Println("No .env file found")
    }

    JWTSecretKey = os.Getenv("JWT_SECRET_KEY") 
	JWTExpirationInMinutes, _ = strconv.Atoi(os.Getenv("JWT_EXPIRATION_IN_MINUTES"))

    // Pastikan variabel penting ada
    if JWTSecretKey == "" {
        log.Fatal("JWT_SECRET_KEY must be set")
    }
    if JWTExpirationInMinutes == 0 {
        JWTExpirationInMinutes = 60 // Default 1 jam
    }

    dsn := os.Getenv("DB_URL")
    if dsn == "" {
        log.Fatal("DB_URL must be set in .env file")
    }
    
    DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        panic("Failed to connect database")
    }

    log.Println("✅ Database connected successfully")
}

func GetDB() *gorm.DB {
	return DB
}