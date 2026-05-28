package repositories

import (
	"backend-bebu/internal/models"

	"gorm.io/gorm"
)

type PostShareRepository interface {
	WithTransaction(func(repo PostShareRepository) error) error
	CreateShare(share *models.PostShare) error
	IncrementShareCount(postID uint) error
	GetOrCreateDirectConversation(senderID, receiverID uint) (uint, error)
	CreateMessage(msg *models.Message) error
	GetRecentShareRecipients(senderID uint, limit int) ([]models.User, error)
}

type postShareRepository struct {
	db *gorm.DB
}

func NewPostShareRepository(db *gorm.DB) PostShareRepository {
	return &postShareRepository{db}
}

// Helper untuk Transaksi
func (r *postShareRepository) WithTransaction(fn func(repo PostShareRepository) error) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		return fn(&postShareRepository{db: tx})
	})
}

func (r *postShareRepository) CreateShare(share *models.PostShare) error {
	return r.db.Create(share).Error
}

func (r *postShareRepository) IncrementShareCount(postID uint) error {
	return r.db.Model(&models.PostStat{}).Where("post_id = ?", postID).
		UpdateColumn("share_count", gorm.Expr("share_count + ?", 1)).Error
}

func (r *postShareRepository) CreateMessage(msg *models.Message) error {
	return r.db.Create(msg).Error
}

// Logika mencari percakapan 1-on-1 yang sudah ada atau buat baru
func (r *postShareRepository) GetOrCreateDirectConversation(senderID, receiverID uint) (uint, error) {
	var convID uint

	// Cari conversation_id, bukan modelnya, agar lebih ringan
	err := r.db.Raw(`
        SELECT cm1.conversation_id 
        FROM conversation_members cm1
        JOIN conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
        JOIN conversations c ON c.conversation_id = cm1.conversation_id
        WHERE cm1.user_id = ? 
          AND cm2.user_id = ? 
          AND c.conversation_type = 'direct'
        LIMIT 1
    `, senderID, receiverID).Scan(&convID).Error

	if err == nil && convID != 0 {
		return convID, nil
	}

	// Jika tidak ada, buat percakapan baru
	newConv := models.Conversation{
		CreatedByUserID:  senderID,
		ConversationType: "direct",
	}

	if err := r.db.Create(&newConv).Error; err != nil {
		return 0, err
	}

	// Insert members
	members := []models.ConversationMember{
		{ConversationID: newConv.ConversationID, UserID: senderID},
		{ConversationID: newConv.ConversationID, UserID: receiverID},
	}

	if err := r.db.Create(&members).Error; err != nil {
		return 0, err
	}

	return newConv.ConversationID, nil
}

func (r *postShareRepository) GetRecentShareRecipients(senderID uint, limit int) ([]models.User, error) {
    var users []models.User
    
    // Kita ambil data User dan melakukan Eager Loading pada Profile
    err := r.db.
        Preload("Profile").
        Joins("JOIN post_shares ON post_shares.user_receiver_id = users.user_id").
        Where("post_shares.user_sender_id = ?", senderID).
        Group("users.user_id").
        Order("MAX(post_shares.created_at) DESC").
        Limit(limit).
        Find(&users).Error

    return users, err
}