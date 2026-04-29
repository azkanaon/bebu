package dto

type ReviewPostResponse struct {
	ID   string `json:"id"`
	Type string `json:"type"`

	User struct {
		Username    string `json:"username"`
		DisplayName string `json:"displayName"`
		Avatar      string `json:"avatar"`
	} `json:"user"`

	CreatedAt string `json:"createdAt"`
	Content   string `json:"content"`

	Likes    int  `json:"likes"`
	Comments int  `json:"comments"`
	Shares   int  `json:"shares"`
	Saved    int `json:"saved"`

	Book struct {
		Title  string   `json:"title"`
		Author string   `json:"author"`
		Pages  int      `json:"pages"`
		Cover  string   `json:"cover"`
		Genres []string `json:"genres"`
		Rating int      `json:"rating"`
	} `json:"book"`
}

type AnalysisPostResponse struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	Content   string `json:"content"`
	Image     string `json:"image"`
	CreatedAt string `json:"createdAt"`

	Likes    int `json:"likes"`
	Comments int `json:"comments"`
	Shares   int `json:"shares"`

	User struct {
		DisplayName string `json:"displayName"`
		Avatar      string `json:"avatar"`
	} `json:"user"`

	Book struct {
		Title string `json:"title"`
		Cover string `json:"cover"`
	} `json:"book"`
}

type CreatePostRequest struct {
	UserID      uint     `json:"user_id"`
	BookID      uint     `json:"book_id"`
	Description string   `json:"description"`
	PostType    string   `json:"post_type"` // review | analysis
	Rating      float64  `json:"rating"`
	ImgURL      string   `json:"img_url"`
	Categories  []string `json:"categories"` // 🔥 nama kategori
}