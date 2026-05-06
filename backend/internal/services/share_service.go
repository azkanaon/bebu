// services/post_share_service.go
package services

import (
	"backend-bebu/internal/dto"
	"backend-bebu/internal/models"
	"backend-bebu/internal/repositories"
)

type PostShareService interface {
	ExecuteShare(senderID uint, req dto.ShareRequest) error
	GetRecentRecipients(senderID uint) ([]dto.UserSearchResponse, error)
}

type postShareService struct {
	repo repositories.PostShareRepository
}

func NewPostShareService(repo repositories.PostShareRepository) PostShareService {
	return &postShareService{repo}
}

func (s *postShareService) ExecuteShare(senderID uint, req dto.ShareRequest) error {
	return s.repo.WithTransaction(func(txRepo repositories.PostShareRepository) error {
		
		for _, receiverID := range req.ReceiverIDs {
			if senderID == receiverID {
				continue
			}

			convID, err := txRepo.GetOrCreateDirectConversation(senderID, receiverID)
			if err != nil {
				return err
			}

			shareLog := models.PostShare{
				PostID:         req.PostID,
				UserSenderID:   senderID,
				UserReceiverID: receiverID,
			}
			if err := txRepo.CreateShare(&shareLog); err != nil {
				return err
			}

			postMsg := models.Message{
				ConversationID: convID,
				SenderUserID:   senderID,
				PostID:         &req.PostID,
				MessageType:    "post",
				Body:           nil, 
			}
			if err := txRepo.CreateMessage(&postMsg); err != nil {
				return err
			}

			if req.Message != "" {
				msgBody := req.Message
				textMsg := models.Message{
					ConversationID: convID,
					SenderUserID:   senderID,
					PostID:         nil, 
					MessageType:    "text",
					Body:           &msgBody,
				}
				if err := txRepo.CreateMessage(&textMsg); err != nil {
					return err
				}
			}

			if err := txRepo.IncrementShareCount(req.PostID); err != nil {
				return err
			}
		}
		
		return nil
	})
}

func (s *postShareService) GetRecentRecipients(senderID uint) ([]dto.UserSearchResponse, error) {
    users, err := s.repo.GetRecentShareRecipients(senderID, 10)
    if err != nil {
        return nil, err
    }

    var resp []dto.UserSearchResponse
    for _, u := range users {
        avatar := ""
        displayName := u.Username // Fallback ke username jika profile kosong

        if u.Profile != nil {
            avatar = u.Profile.AvatarUrl
            if u.Profile.DisplayName != "" {
                displayName = u.Profile.DisplayName
            }
        }

        resp = append(resp, dto.UserSearchResponse{
            ID:          u.UserID,
            Username:    u.Username,
            DisplayName: displayName,
            Avatar:      avatar,
        })
    }
    return resp, nil
}