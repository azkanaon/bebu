package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
	"backend-bebu/internal/ws"
	"time"

	"github.com/gin-gonic/gin"
)


type NotificationService interface {
	Send(receiverID, actorID uint, notifType, entityType string, entityID uint)
	GetMyNotifications(userID uint, page, limit int) ([]dto.NotificationResponseDTO, *dto.PaginationDTO, error)
	Remove(receiverID, actorID uint, notifType, entityType string, entityID uint, amount int)
	MarkNotificationAsRead(userID uint, notifID uint) error
	MarkAllNotificationsAsRead(userID uint) error
	GetLatestNotificationForWS(receiverID uint, notifType string, entityID uint) (*dto.NotificationResponseDTO, error)
	GetUnreadCount(userID uint) (int64, error)
}

type notificationService struct {
	repo repositories.NotificationRepository
	hub  *ws.Hub
}

func NewNotificationService(repo repositories.NotificationRepository, hub *ws.Hub) NotificationService {
	return &notificationService{repo: repo, hub:  hub}
}

func (s *notificationService) GetLatestNotificationForWS(receiverID uint, notifType string, entityID uint) (*dto.NotificationResponseDTO, error) {
	// 1. Ambil data mentah dari repo
	n, err := s.repo.GetLatest(receiverID, notifType, entityID)
	if err != nil {
		return nil, err
	}

	// 2. Mapping ke DTO (Gunakan format yang sama dengan GetMyNotifications)
	return &dto.NotificationResponseDTO{
		ID:               n.NotificationID,
		ActorUsername:    n.Actor.Username,
		ActorDisplayName: n.Actor.Profile.DisplayName,
		ActorAvatar:      n.Actor.Profile.AvatarUrl,
		Type:             n.NotificationType,
		EntityType:       n.EntityType,
		EntityID:         n.EntityID,
		ExtraActorsCount: n.ExtraActorsCount,
		IsRead:           n.IsRead,
		CreatedAt:        n.UpdatedAt, // Waktu update terakhir
	}, nil
}

// Send dijalankan secara Async (Goroutine)
func (s *notificationService) Send(receiverID, actorID uint, notifType, entityType string, entityID uint) {
	// Jangan kirim notifikasi ke diri sendiri
	if receiverID == actorID {
		return
	}

	notif := &models.Notification{
		UserReceiverID:   receiverID,
		UserActedID:      actorID,
		NotificationType: notifType,
		EntityType:       entityType,
		EntityID:         entityID,
		UpdatedAt:        time.Now(),
	}

	err := s.repo.CreateOrUpdate(notif)

	if err == nil {
		// Ambil data terbaru dari DB agar info Actor & ExtraCount akurat
		// (Kita panggil fungsi mapping yang sudah ada agar format JSON-nya sama)
		fullNotif, _ := s.GetLatestNotificationForWS(receiverID, notifType, entityID)
		if fullNotif != nil {
            // --- MODIFIKASI DI SINI ---
            s.hub.SendToUser(receiverID, gin.H{
                "event":   "NEW_NOTIFICATION", // Ganti dari "type" menjadi "event"
                "payload": fullNotif,          // DTO Notifikasi sebagai payload
            })
        }
	}
}

func (s *notificationService) GetMyNotifications(userID uint, page, limit int) ([]dto.NotificationResponseDTO, *dto.PaginationDTO, error) {
	notifs, total, err := s.repo.GetNotifications(userID, page, limit)
	if err != nil {
		return nil, nil, err
	}

	dtos := make([]dto.NotificationResponseDTO, 0, len(notifs))
	for _, n := range notifs {
		dtos = append(dtos, dto.NotificationResponseDTO{
			ID:               n.NotificationID,
			ActorUsername:    n.Actor.Username,
			ActorDisplayName: n.Actor.Profile.DisplayName,
			ActorAvatar:      n.Actor.Profile.AvatarUrl,
			Type:             n.NotificationType,
			EntityType:       n.EntityType,
			EntityID:         n.EntityID,
			ExtraActorsCount: n.ExtraActorsCount,
			IsRead:           n.IsRead,
			CreatedAt:        n.UpdatedAt, // Gunakan UpdatedAt agar user tahu aksi terbaru kapan
		})
	}

	return dtos, dto.NewPaginationDTO(total, page, limit), nil
}

func (s *notificationService) Remove(receiverID, actorID uint, notifType, entityType string, entityID uint, amount int){
	if receiverID == actorID {
		return
	}

	notif := &models.Notification{
		UserReceiverID:   receiverID,
		NotificationType: notifType,
		EntityID:         entityID,
	}

	// Jalankan secara Async
	go s.repo.RemoveOrDecrement(notif, actorID, amount)
}

// Implementasi
func (s *notificationService) MarkNotificationAsRead(userID uint, notifID uint) error {
	return s.repo.MarkAsRead(userID, notifID)
}

func (s *notificationService) MarkAllNotificationsAsRead(userID uint) error {
	return s.repo.MarkAllAsRead(userID)
}

func (s *notificationService) GetUnreadCount(userID uint) (int64, error) {
	return s.repo.CountUnread(userID)
}