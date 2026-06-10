import {
	CreatePostPayload,
	CreateCommentRequest,
	ShareRequest,
	ShareResponse,
	UserSearchResponse,
	GenericResponse,
} from "@/types/post";
import {
	BookFiltersResponse,
	BookProfileResponse,
	BookRecommendationsResponse,
} from "@/types/book";
import {
	ReportRequest,
	ReportResponse,
	PaginatedReportAPIResponse,
	ReportQueryParams,
	GetReportDetailAPIResponse,
	AdminActionRequest,
	AdminActionResponse,
} from "@/types/report";
import {
	UserQueryParams,
	PaginatedUserAPIResponse,
} from "@/types/user-management";
import {
	PostQueryParams,
	PaginatedPostAPIResponse,
} from "@/types/post-management";
import {
	BookQueryParams,
	PaginatedBookResponse,
	UpsertBookRequest,
	SubmissionQueryParams,
	PaginatedSubmissionResponse,
	RejectSubmissionRequest,
	AuthorResponse,
	GenreResponse,
} from "@/types/book-management";
import { FriendRecommendationItem } from "@/types/user";
import { LeaderboardResponse, TabType } from "@/types/leaderboard";
import api from "@/lib/axios";

// Get Data Leaderboard Right Sidebar
export async function getLeaderboardAPI(
	timeFrame: TabType,
	limit: number = 5,
): Promise<LeaderboardResponse> {
	const res = await api.get(
		`/v1/leaderboard?type=${timeFrame}&limit=${limit}`,
	);
	return res.data;
}

/* --- POSTS --- */
export async function getPostsAPI(
	tab: string,
	cursor: number = 0,
	limit: number = 10,
	categoryId?: number | null,
) {
	const res = await api.get("/v1/posts", {
		params: {
			tab,
			cursor,
			limit,
			category_id: categoryId || undefined, // Kirim jika ada
		},
	});
	return res.data;
}

export async function getPostByPublicIdAPI(publicId: string) {
	const res = await api.get(`/v1/posts/${publicId}`);
	return res.data;
}

/* --- CATEGORIES --- */

export async function getAllCategoriesAPI() {
	const res = await api.get("/v1/categories");
	return res.data;
}

export async function favoriteCategoryAPI(id: number) {
	const res = await api.post(`/v1/categories/${id}/favorite`);
	return res.data;
}

export async function unfavoriteCategoryAPI(id: number) {
	const res = await api.delete(`/v1/categories/${id}/favorite`);
	return res.data;
}

export async function getUserCategoriesAPI() {
	const res = await api.get("/v1/categories/user");
	return res.data;
}

export async function searchCategoriesAPI(query: string) {
	if (!query) return [];
	// Menggunakan instance 'api' agar interceptor token/base URL ikut terbawa
	const res = await api.get(`/v1/categories/search`, {
		params: { search: query },
	});
	return res.data;
}

/* --- LIST BOOKS --- */

export async function getBooks() {
	const res = await fetch("http://localhost:8080/api/v1/books", {
		cache: "no-store",
	});

	if (!res.ok) throw new Error("Failed to fetch books");

	return res.json();
}

type GetBookFiltersParams = {
	genre?: string | null;
	author?: string | null;
	language?: string | null;
};

export async function getBookFiltersAPI(
	params: GetBookFiltersParams,
): Promise<BookFiltersResponse> {
	const res = await api.get("/v1/books/filters", {
		params: {
			genre: params.genre || undefined,
			author: params.author || undefined,
			language: params.language || undefined,
		},
	});

	return res.data;
}

export async function searchBooksAPI(params: {
	q?: string;
	genre?: string | null;
	author?: string | null;
	language?: string | null;
	page?: number;
	limit?: number;
}) {
	const res = await api.get("/v1/books/search", {
		params: {
			q: params.q || undefined,
			genre: params.genre || undefined,
			author: params.author || undefined,
			language: params.language || undefined,
			page: params.page || 1,
			limit: params.limit || 12,
		},
	});

	return res.data;
}

export async function getPopularBooksAPI(
	range: "today" | "7d" | "30d" | "all",
) {
	const res = await api.get(`/v1/books/popular?range=${range}`);

	return res.data;
}

export async function getHighlyRatedBooksAPI() {
	const res = await api.get("/v1/books/highly-rated");

	return res.data;
}

export async function getAllBooksAPI(params: {
	page?: number;
	limit?: number;
	sort?: "title" | "newest" | "rating" | "popular";
}) {
	const res = await api.get("/v1/books/all-books", {
		params,
	});

	return res.data;
}

/* --- BOOK PROFILE --- */

export async function getBookProfileAPI(
	slug: string,
): Promise<BookProfileResponse> {
	const res = await api.get(`/v1/books/${slug}`);

	return res.data;
}

export async function getBookRecommendationsAPI(
	slug: string,
): Promise<BookRecommendationsResponse> {
	const res = await api.get(`/v1/books/${slug}/recommendations`);
	return res.data;
}

export async function getBookPostsAPI(
	slug: string,
	tab: "review" | "analysis",
	cursor = 0,
	limit = 10,
) {
	const res = await api.get(`/v1/books/${slug}/posts`, {
		params: { tab, cursor, limit },
	});
	return res.data;
}

/* --- POST --- */

export async function createPost(payload: CreatePostPayload) {
	const formData = new FormData();

	formData.append("user_id", String(payload.user_id));
	formData.append("book_id", String(payload.book_id));
	formData.append("description", payload.description);
	formData.append("post_type", payload.post_type);
	formData.append("rating", String(payload.rating));

	formData.append("categories", JSON.stringify(payload.categories));

	if (payload.file) {
		formData.append("image", payload.file);
	}

	const res = await api.post("v1/posts", formData);

	return res.data;
}

export async function deletePostAPI(publicID: string) {
	const res = await api.delete(`/v1/posts/${publicID}`);
	return res.data;
}

export async function followUserAPI(username: string) {
	const res = await api.post(`/v1/users/${username}/follow`);
	return res.data;
}

export async function unfollowUserAPI(username: string) {
	const res = await api.delete(`/v1/users/${username}/follow`);
	return res.data;
}

export async function toggleLikeAPI(postId: number) {
	const res = await api.post(`/v1/posts/${postId}/like`);
	return res.data;
}

export async function toggleSaveAPI(postId: number) {
	const res = await api.post(`/v1/posts/${postId}/save`);
	return res.data;
}

export async function getCommentsAPI(postId: number) {
	const res = await api.get(`/v1/posts/${postId}/comments`);
	return res.data.data;
}

export async function createCommentAPI(payload: CreateCommentRequest) {
	const res = await api.post("/v1/comments/", payload);
	return res.data;
}

export async function toggleLikeCommentAPI(commentId: number) {
	const res = await api.post(`/v1/comments/${commentId}/like`);
	return res.data;
}

export async function deleteCommentAPI(commentId: number, postId: number) {
	const res = await api.delete(`/v1/comments/${commentId}?post_id=${postId}`);
	return res.data;
}

export async function sharePostAPI(data: ShareRequest): Promise<ShareResponse> {
	const res = await api.post("/v1/posts/shares", data);
	return res.data;
}

export async function getRecentRecipientsAPI(): Promise<
	GenericResponse<UserSearchResponse[]>
> {
	const res = await api.get("/v1/posts/shares/recent-recipients");
	return res.data;
}

export async function createReportAPI(
	data: ReportRequest,
): Promise<ReportResponse> {
	const res = await api.post("/v1/report", data);
	return res.data;
}

// Pencarian user umum
export async function searchUsersAPI(
	query: string,
): Promise<GenericResponse<UserSearchResponse[]>> {
	const res = await api.get(`/v1/users/search?q=${query}`);
	return res.data;
}

/* --- REPORT MANAGEMENT --- */

export async function getReportSummariesAPIs(
	params: ReportQueryParams,
): Promise<PaginatedReportAPIResponse> {
	const res = await api.get("/v1/admin/reports", { params });
	return res.data; // Mengembalikan object { data, total_count, current_page, total_pages }
}

export async function getReportDetailAPI(
	summaryID: number,
): Promise<GetReportDetailAPIResponse> {
	const res = await api.get(`/v1/admin/reports/${summaryID}/detail`);
	return res.data;
}

// Admin Action
export async function executeAdminActionAPI(
	payload: AdminActionRequest,
): Promise<AdminActionResponse> {
	const res = await api.post("/v1/admin/reports/action", payload);
	return res.data;
}

/* --- USER MANAGEMENT --- */
// Ambil list data user dengan kriteria filter server-side
export async function getUserManagementAPIs(
	params: UserQueryParams,
): Promise<PaginatedUserAPIResponse> {
	const res = await api.get("/v1/admin/users", { params });
	return res.data;
}

// Mutasi status user (active / suspended / banned)
export async function updateUserStatusAPI(
	userID: number,
	status: "active" | "suspended" | "banned" | "shadowbanned",
): Promise<{ message: string }> {
	const res = await api.put(`/v1/admin/users/${userID}/status`, { status });
	return res.data;
}

/* --- POST MANAGEMENT --- */
// Ambil list data postingan dengan kriteria filter server-side
export async function getPostManagementAPIs(
	params: PostQueryParams,
): Promise<PaginatedPostAPIResponse> {
	const res = await api.get("/v1/admin/posts", { params });
	return res.data;
}

// Mutasi status publikasi post (published / soft_delete / hard_delete)
export async function updatePostStatusAPI(
	postID: number,
	status: "published" | "soft_delete" | "hard_delete" | "shadowbanned",
): Promise<{ message: string }> {
	const res = await api.put(`/v1/admin/posts/${postID}/status`, { status });
	return res.data;
}

/* --- BOOK MANAGEMENT --- */

// ==========================================
// MASTER BOOKS INTEGRATION
// ==========================================

export async function getMasterBooksAPI(
	params: BookQueryParams,
): Promise<PaginatedBookResponse> {
	const res = await api.get("/v1/admin/books", { params });
	return res.data;
}

export async function createBookAPI(data: UpsertBookRequest) {
	const res = await api.post("/v1/admin/books", data);
	return res.data;
}

export async function updateBookAPI(bookId: number, data: UpsertBookRequest) {
	const res = await api.put(`/v1/admin/books/${bookId}`, data);
	return res.data;
}

export async function uploadBookCoverAPI(
	file: File,
): Promise<{ image_url: string }> {
	const formData = new FormData();
	formData.append("cover_image", file);

	const res = await api.post("/v1/admin/books/upload", formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});
	return res.data;
}

export async function deleteBookAPI(bookId: number) {
	const res = await api.delete(`/v1/admin/books/${bookId}`);
	return res.data;
}

// ==========================================
// BOOK SUBMISSIONS INTEGRATION
// ==========================================

export async function getBookSubmissionsAPI(
	params: SubmissionQueryParams,
): Promise<PaginatedSubmissionResponse> {
	const res = await api.get("/v1/admin/books/submissions", { params });
	return res.data;
}

// Opsi Aksi 1 & 2: Approve & Publish (Menggunakan request form buku master baru)
export async function approveSubmissionAPI(
	submissionId: number,
	data: UpsertBookRequest,
) {
	const res = await api.post(
		`/v1/admin/books/submissions/${submissionId}/approve`,
		data,
	);
	return res.data;
}

// Opsi Aksi 3: Reject / Mark as Duplicate
export async function rejectSubmissionAPI(
	submissionId: number,
	data: RejectSubmissionRequest,
) {
	const res = await api.post(
		`/v1/admin/books/submissions/${submissionId}/reject`,
		data,
	);
	return res.data;
}

export async function searchAuthorsAPI(
	query: string,
): Promise<{ data: AuthorResponse[] }> {
	const res = await api.get(
		`/v1/authors/search?q=${encodeURIComponent(query)}`,
	);

	// Jika instance `api` Anda adalah Axios, kembalikan `res.data`
	return res.data;
}

export async function searchGenresAPI(
	query: string,
): Promise<{ data: GenreResponse[] }> {
	const res = await api.get(
		`/v1/genres/search?q=${encodeURIComponent(query)}`,
	);

	// Jika instance `api` Anda adalah Axios, kembalikan `res.data`
	return res.data;
}

/* Aside Right Sidebar */
// Friend Recommendation
export async function getFriendRecommendationsAPI(): Promise<
	FriendRecommendationItem[]
> {
	const res = await api.get("/v1/users/recommendation");
	return res.data;
}