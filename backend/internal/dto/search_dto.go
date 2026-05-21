package dto

// SearchTopResponseDTO adalah hasil untuk tab 'TOP'
type SearchTopResponseDTO struct {
	Books []BookSearchItem  `json:"books"`
	Users []UserSummaryDTO  `json:"users"`
	Posts []PostSummaryDTO  `json:"posts"`
}

type SearchHistoryDTO struct {
	ID    uint   `json:"id"`
	Query string `json:"query"`
}