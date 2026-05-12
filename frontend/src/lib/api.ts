import { CreatePostPayload, CreateCommentRequest, ShareRequest, ShareResponse, UserSearchResponse, GenericResponse } from "@/types/post";
import { ReportRequest, ReportResponse } from "@/types/report";
import api from "@/lib/axios";

export async function getBooks() {
	const res = await fetch("http://localhost:8080/api/v1/books", {
		cache: "no-store",
	});

	if (!res.ok) throw new Error("Failed to fetch books");

	return res.json();
}

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
    const res = await api.post('/v1/comments/', payload);
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

export async function createReportAPI(data: ReportRequest): Promise<ReportResponse> {
    const res = await api.post('/v1/report', data);
    return res.data;
}

export async function sharePostAPI(data: ShareRequest): Promise<ShareResponse> {
    const res = await api.post('/v1/posts/shares', data);
    return res.data;
}

export async function getRecentRecipientsAPI(): Promise<GenericResponse<UserSearchResponse[]>> {
    const res = await api.get('/v1/posts/shares/recent-recipients');
    return res.data;
}

// Pencarian user umum
export async function searchUsersAPI(query: string): Promise<GenericResponse<UserSearchResponse[]>> {
    const res = await api.get(`/v1/users/search?q=${query}`);
    return res.data;
}