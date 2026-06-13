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
	GetUserConversations(userID uint) ([]models.Conversation, error)
	IsMember(convID, userID uint) (bool, error)
	GetMessages(convID uint, page, limit int) ([]models.Message, int64, error)
	MarkAsRead(convID, userID, lastMsgID uint) error
	GetUnreadCount(convID, userID uint, lastReadID uint) (int, error)
	CreateGroup(conv *models.Conversation) error
	FindMessageByID(id uint) (*models.Message, error)
	FindConversationByID(id uint) (*models.Conversation, error)
	IsAdmin(convID, userID uint) (bool, error)
AddMembers(members []models.ConversationMember) error
UpdateConversationTitle(convID uint, title string) error
RemoveMember(convID, userID uint) error
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

func (r *chatRepository) GetUserConversations(userID uint) ([]models.Conversation, error) {
    var conversations []models.Conversation
    err := r.db.
        Select("conversations.*"). // Mengambil semua kolom termasuk title & img_url
        Joins("JOIN conversation_members ON conversation_members.conversation_id = conversations.conversation_id").
        Where("conversation_members.user_id = ?", userID).
        Preload("Members.User.Profile"). // Tetap preload untuk DM
        Order("last_message_at DESC").
        Find(&conversations).Error
    return conversations, err
}

func (r *chatRepository) IsMember(convID, userID uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.ConversationMember{}).
		Where("conversation_id = ? AND user_id = ?", convID, userID).
		Count(&count).Error
	return count > 0, err
}

func (r *chatRepository) GetMessages(convID uint, page, limit int) ([]models.Message, int64, error) {
	var messages []models.Message
	var total int64
	offset := (page - 1) * limit

	query := r.db.Model(&models.Message{}).Where("conversation_id = ?", convID)
	query.Count(&total)

	err := query.
		Preload("Sender.Profile").
		Preload("ParentMessage.Sender.Profile"). // Preload info pesan yang dibalas
		Preload("Post.User.Profile"). 
		Preload("Post.Stats").
		Preload("Book.BookAuthors.Author").
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&messages).Error

	return messages, total, err
}

func (r *chatRepository) MarkAsRead(convID, userID, lastMsgID uint) error {
	return r.db.Model(&models.ConversationMember{}).
		Where("conversation_id = ? AND user_id = ?", convID, userID).
		Update("last_read_message_id", lastMsgID).Error
}

// Implementasi GetUnreadCount
func (r *chatRepository) GetUnreadCount(convID, userID uint, lastReadID uint) (int, error) {
	var count int64
	// Hitung pesan di room ini yang ID-nya lebih besar dari ID pesan terakhir yang dibaca user
	err := r.db.Model(&models.Message{}).
		Where("conversation_id = ? AND message_id > ?", convID, lastReadID).
		Count(&count).Error
	return int(count), err
}

func (r *chatRepository) CreateGroup(conv *models.Conversation) error {
	// GORM akan otomatis menyimpan Conversation + ConversationMembers (Nested Create)
	return r.db.Create(conv).Error
}

func (r *chatRepository) FindMessageByID(id uint) (*models.Message, error) {
	var msg models.Message
	
	// Kita preload Sender agar bisa menampilkan nama pengirim asli di cuplikan reply
	err := r.db.Preload("Sender.Profile").
		Where("message_id = ?", id).
		First(&msg).Error
		
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

func (r *chatRepository) FindConversationByID(id uint) (*models.Conversation, error) {
	var conv models.Conversation
	err := r.db.Preload("Members").First(&conv, id).Error
	return &conv, err
}

func (r *chatRepository) IsAdmin(convID, userID uint) (bool, error) {
	var member models.ConversationMember
	err := r.db.Where("conversation_id = ? AND user_id = ? AND role = ?", convID, userID, "admin").
		First(&member).Error
	if err != nil {
		return false, nil
	}
	return true, nil
}

// Implementasi AddMembers
func (r *chatRepository) AddMembers(members []models.ConversationMember) error {
	return r.db.Create(&members).Error
}

// Implementasi UpdateConversationTitle
func (r *chatRepository) UpdateConversationTitle(convID uint, title string) error {
	return r.db.Model(&models.Conversation{}).
		Where("conversation_id = ?", convID).
		Update("title", title).Error
}

func (r *chatRepository) RemoveMember(convID, userID uint) error {
	// Hard delete dari tabel member agar user benar-benar keluar
	return r.db.Where("conversation_id = ? AND user_id = ?", convID, userID).
		Delete(&models.ConversationMember{}).Error
}