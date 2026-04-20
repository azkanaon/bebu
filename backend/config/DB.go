package config

import(
	"log"
    "os"
    "github.com/joho/godotenv"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
    // Load .env
    err := godotenv.Load()
    if err != nil {
        log.Println("No .env file found")
    }

    dsn := os.Getenv("DB_URL")

    DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        panic("Failed to connect database")
    }

    log.Println("✅ Database connected successfully")
}

func GetDB() *gorm.DB {
	return DB
}