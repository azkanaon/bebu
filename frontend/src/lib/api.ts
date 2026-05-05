import { CreatePostPayload, CreateCommentRequest } from "@/types/post";
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

	const res = await fetch("http://localhost:8080/api/v1/posts", {
		method: "POST",
		body: formData,
	});

	const data = await res.json();

	if (!res.ok) {
		throw new Error(data.error || "Failed");
	}

	return data;
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