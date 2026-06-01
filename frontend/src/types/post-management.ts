export interface PostQueryParams {
	page: number;
	limit: number;
	search: string;
	publish_status: "published" | "shadowbanned" | "soft_deleted" | "";
}

export interface PostManageableResponse {
	post_id: number;
	public_id: string;
	description: string;
	post_type: string;
	rating: number;
	img_url: string;
	publish_status: "published" | "shadowbanned" | "soft_deleted";
	created_at: string;
	username: string;
	book_title: string;
	like_count: number;
	comment_count: number;
}

export interface PaginatedPostAPIResponse {
	data: PostManageableResponse[];
	total_rows: number;
	total_pages: number;
	page: number;
	limit: number;
}