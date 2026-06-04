export interface ReportRequest {
	entity_id: number;
	entity_type: "post" | "user" | "comment";
	reason_text: string;
}

export interface ReportResponse {
	message: string;
}

export type ReasonCount = {
	reason_text: string;
	count: number;
};

export interface ReportQueryParams {
	search?: string;
	status?: string;
	type?: string;
	page: number; // Wajib ada
	limit: number; // Wajib ada
}

export interface PaginatedReportAPIResponse {
	data: ReportSummaryResponse[];
	total_count: number;
	current_page: number;
	total_pages: number;
}

export type UserDetailReport = {
	avatar_url: string;
	display_name: string;
	username: string;
	bio: string;
	created_at: string;
	status: string;
	email_verified: boolean;
	location: string;
	total_followers: number;
	total_following: number;
	total_posts: number;
	hot_score: number;
};

export type PostDetailReport = {
	public_id: string;
	description: string;
	post_type: string;
	username: string;
	img_url: string;
	publish_status: string;
	book_title: string;
	post_slug: string;
	like_count: number;
	comment_count: number;
	share_count: number;
	save_count: number;
	hot_score: number;
};

export type ReportSummaryResponse = {
	report_summary_id: number;
	entity_id: number;
	entity_type: "user" | "post";
	target: string;
	total_reports: number;
	unique_reports: number;
	last_report: string;
	status: "Resolved" | "Not reviewed" | "Dismissed";
};

export interface ModerationHistory {
	admin_action_id: number;
	action_type: string;
	reason?: string;
	duration_days?: number;
	admin_username: string;
	created_at: string;
}

export type ReportSummaryDetailResponse = {
	report_summary_id: number;
	entity_id: number;
	entity_type: "user" | "post";
	total_reports: number;
	unique_reports: number;
	first_report: string;
	last_report: string;
	status: "Resolved" | "Not reviewed" | "Dismissed";
	reason_counts: ReasonCount[];
	user_data?: UserDetailReport;
	post_data?: PostDetailReport;
	moderation_history?: ModerationHistory;
};

// API Wrapper Responses
export type GetReportsAPIResponse = {
	status: string;
	message: string;
	data: ReportSummaryResponse[];
};

export type GetReportDetailAPIResponse = {
	status: string;
	message: string;
	data: ReportSummaryDetailResponse;
};

/* --- ADMIN ACTION --- */
export interface AdminActionRequest {
	report_summary_id: number;
	action: string; // 'dismiss' | 'warning' | etc.
	duration_days: number | null; // null jika instan, -1 jika permanen/tanpa batas
	reason: string;
}

export interface AdminActionResponse {
	message: string;
	status: string;
}