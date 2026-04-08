package main

import (
	"fmt"
	"net/http"
)

func main() {
	// Membuat rute API dasar (Endpoint)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Halo! Backend Golang-mu sudah berhasil menyala 🚀")
	})

	// Menyalakan server di port 8080
	fmt.Println("Server backend sedang berjalan di http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
