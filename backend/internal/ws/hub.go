package ws

import (
	"sync"

	"github.com/gorilla/websocket"
)

// Hub mengelola semua koneksi websocket yang aktif
type Hub struct {
	// Map untuk menyimpan koneksi: key adalah UserID, value adalah koneksinya
	// Kita pakai sync.Map agar aman saat diakses oleh banyak goroutine sekaligus
	Clients sync.Map 
}

func NewHub() *Hub {
	return &Hub{}
}

// Register menambahkan user ke daftar online
func (h *Hub) Register(userID uint, conn *websocket.Conn) {
	h.Clients.Store(userID, conn)
}

// Unregister menghapus user dari daftar online (saat logout/disconnect)
func (h *Hub) Unregister(userID uint) {
	if conn, ok := h.Clients.Load(userID); ok {
		conn.(*websocket.Conn).Close()
		h.Clients.Delete(userID)
	}
}

// SendToUser mengirimkan data ke user spesifik jika dia sedang online
func (h *Hub) SendToUser(userID uint, data interface{}) {
	if conn, ok := h.Clients.Load(userID); ok {
		// Kirim data dalam format JSON
		err := conn.(*websocket.Conn).WriteJSON(data)
		if err != nil {
			// Jika gagal kirim (misal koneksi putus tiba-tiba), hapus dari daftar
			h.Unregister(userID)
		}
	}
}