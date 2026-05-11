package dto

type UpdateFavoriteItemDTO struct {
	ItemID uint  `json:"itemId" binding:"required"` // badge_id atau achievement_id
	Order  int16 `json:"order" binding:"required,min=1,max=4"`
}