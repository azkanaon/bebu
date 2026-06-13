package repositories

import (
	"backend-bebu/internal/models"
	"time"

	"gorm.io/gorm"
)

type ChatRepository interface {
	WithTx(tx *gorm.DB) ChatRepository
	FindDirectConversation(userID1, userID2 uint) (*models.Conversation, error)
	CreateConversation(conv *models.Conversation) error
	CreateMessage(msg *models.Message) error
	UpdateLastMessage(convID uint, t time.Time) error
}

type chatRepository struct {
	db *gorm.DB
}

func NewChatRepository(db *gorm.DB) ChatRepository {
	return &chatRepository{db: db}
}

func (r *chatRepository) WithTx(tx *gorm.DB) ChatRepository {
	return &chatRepository{db: tx}
}

// Menemukan percakapan DM antara dua user
func (r *chatRepository) FindDirectConversation(userID1, userID2 uint) (*models.Conversation, error) {
	var member models.ConversationMember
	
	// Logika: Cari conversation_id yang dimiliki oleh keduannya (userID1 dan userID2)
	// dan tipenya adalah 'direct'
	err := r.db.Table("conversation_members").
		Select("conversation_id").
		Where("user_id IN ?", []uint{userID1, userID2}).
		Group("conversation_id").
		Having("COUNT(DISTINCT user_id) = 2").
		Limit(1).
		Scan(&member.ConversationID).Error

	if err != nil || member.ConversationID == 0 {
		return nil, gorm.ErrRecordNotFound
	}

	var conv models.Conversation
	err = r.db.Where("conversation_id = ? AND conversation_type = ?", member.ConversationID, "direct").
		First(&conv).Error

	return &conv, err
}

func (r *chatRepository) CreateConversation(conv *models.Conversation) error {
	return r.db.Create(conv).Error
}

func (r *chatRepository) CreateMessage(msg *models.Message) error {
	return r.db.Create(msg).Error
}

func (r *chatRepository) UpdateLastMessage(convID uint, t time.Time) error {
	return r.db.Model(&models.Conversation{}).
		Where("conversation_id = ?", convID).
		Update("last_message_at", t).Error
}