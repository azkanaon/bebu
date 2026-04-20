// package main

// import (
// 	"fmt"
// 	"net/http"
// )

// func main() {
// 	// Membuat rute API dasar (Endpoint)
// 	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
// 		fmt.Fprintf(w, "Halo! Backend Golang-mu sudah berhasil menyala 🚀")
// 	})

// 	// Menyalakan server di port 8080
// 	fmt.Println("Server backend sedang berjalan di http://localhost:8080")
// 	http.ListenAndServe(":8080", nil)
// }

package main

import (
    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"
    "backend-bebu/config"
    "backend-bebu/internal/handlers"
)

func main() {
    r := gin.Default()

    r.Use(cors.Default())

    config.ConnectDB()
    SetupRoutes(r)

    r.Run(":8080") // 🔥 INI YANG KURANG
}

func SetupRoutes(r *gin.Engine) {
    api := r.Group("/api")
    {
        api.GET("/me", handlers.GetCurrentUser)
    }
}