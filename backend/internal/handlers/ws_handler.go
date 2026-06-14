package handlers

import (
	"backend-bebu/internal/ws"
	"log"
	"net/http"

	"backend-bebu/internal/repositories"

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
	chatRepo repositories.ChatRepository
}

func NewWSHandler(hub *ws.Hub, repo repositories.ChatRepository) *WSHandler {
	return &WSHandler{hub: hub, chatRepo: repo}
}

type WSRequest struct {
	Type           string `json:"type"` // START_TYPING atau STOP_TYPING
	ConversationID uint   `json:"conversationId"`
}

func (h *WSHandler) HandleWS(c *gin.Context) {
	userIDValue, _ := c.Get("userID")
	userID := userIDValue.(uint)

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil { return }

	h.hub.Register(userID, conn)
	defer h.hub.Unregister(userID)

	log.Printf("[WS] User %d connected", userID)

	for {
		var req WSRequest
		err := conn.ReadJSON(&req)
		if err != nil {
			break
		}

		if req.Type == "START_TYPING" || req.Type == "STOP_TYPING" {
			h.broadcastTypingStatus(userID, req)
		}
	}
}

func (h *WSHandler) broadcastTypingStatus(senderID uint, req WSRequest) {
	conv, err := h.chatRepo.FindConversationByID(req.ConversationID)
	if err != nil {
		return
	}

	for _, m := range conv.Members {
		if m.UserID != senderID {
			log.Printf("[WS] Sending typing status to user %d", m.UserID)
			h.hub.SendToUser(m.UserID, gin.H{
				"type": "USER_TYPING_STATUS",
				"payload": gin.H{
					"conversationId": req.ConversationID,
					"userId":         senderID,
					"isTyping":       req.Type == "START_TYPING",
				},
			})
		}
	}
}