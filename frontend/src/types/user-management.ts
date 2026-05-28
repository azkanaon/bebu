export interface UserQueryParams {
	search?: string;
	status?: string;
	role?: string;
	page: number;
	limit: number;
}

export interface UserManageableResponse {
	user_id: number;
	username: string;
	email: string;
	role: string;
	status: string;
	is_active: boolean;
	email_verified: boolean;
	last_login: string | null;
	created_at: string;
	display_name: string;
	avatar_url: string;
}

export interface PaginatedUserAPIResponse {
	data: UserManageableResponse[];
	total_count: number;
	current_page: number;
	total_pages: number;
}
