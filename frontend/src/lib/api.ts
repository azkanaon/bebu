import { CreatePostPayload } from "@/types/post";

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

export async function toggleFollowAPI(userId: number) {
	const res = await fetch(`http://localhost:8080/api/v1/users/${userId}/follow`, {
		method: "POST",
		credentials: "include",
	});

	if (!res.ok) throw new Error("Failed");

	return res.json(); // { following: true/false }
}