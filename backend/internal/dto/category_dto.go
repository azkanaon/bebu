package dto

type CategoryResponse struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type CategoryWithStatus struct {
    CategoryResponse
    IsFavorited bool `json:"is_favorited"`
}