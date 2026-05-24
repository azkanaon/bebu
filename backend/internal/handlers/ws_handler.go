package handlers

import (
	"backend-bebu/internal/ws"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Izinkan CORS agar Frontend bisa konek
	CheckOrigin: func(r *http.Request) bool { return true },
}

type WSHandler struct {
	hub *ws.Hub
}

func NewWSHandler(hub *ws.Hub) *WSHandler {
	return &WSHandler{hub: hub}
}

func (h *WSHandler) HandleWS(c *gin.Context) {
	// 1. Ambil UserID dari Token (Wajib login untuk buka socket)
	userIDValue, _ := c.Get("userID")
	userID := userIDValue.(uint)

	// 2. Upgrade koneksi HTTP ke WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	// 3. Masukkan ke daftar online
	h.hub.Register(userID, conn)

	// 4. Pastikan dihapus saat user disconnect
	defer h.hub.Unregister(userID)

	// Jaga koneksi tetap terbuka (listening)
	for {
		if _, _, err := conn.NextReader(); err != nil {
			break
		}
	}
}