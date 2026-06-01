// --- Master Books Types ---
export interface BookQueryParams {
	page: number;
	limit: number;
	search: string;
}

export interface BookResponse {
	book_id: number;
	public_id: string;
	title: string;
	synopsis: string;
	cover_img_url: string;
	google_book_id: string;
	publication_year: number;
	language: string;
	total_pages: number;
	slug: string;
	authors: string[];
	genres: string[];
	created_at: string;
}

export interface PaginatedBookResponse {
	data: BookResponse[];
	total_rows: number;
	page: number;
	limit: number;
	total_pages: number;
}

export interface UpsertBookRequest {
	title: string;
	synopsis?: string;
	cover_img_url?: string;
	google_book_id?: string;
	publication_year?: number;
	language?: string;
	total_pages?: number;
	author_names: string[];
	genre_names: string[];
}

// --- Book Submissions Types ---
export interface SubmissionQueryParams {
	page: number;
	limit: number;
	status:
		| "pending"
		| "approved"
		| "rejected"
		| "duplicate"
		| "needs_revision"
		| "";
	search: string;
}

export interface BookSubmissionResponse {
	book_submission_id: number;
	submitted_by: string; // Format: "Display Name (@username)"
	title: string;
	total_pages: number;
	language: string;
	isbn: string;
	synopsis: string;
	cover_img_url: string;
	user_note: string;
	admin_note: string;
	status:
		| "pending"
		| "approved"
		| "rejected"
		| "duplicate"
		| "needs_revision";
	authors: string[];
	created_at: string;
}

export interface PaginatedSubmissionResponse {
	data: BookSubmissionResponse[];
	total_rows: number;
	page: number;
	limit: number;
	total_pages: number;
}

export interface RejectSubmissionRequest {
	admin_note: string; // Menyimpan alasan penolakan atau informasi duplikasi
}

export interface AuthorResponse {
	id: number;
	name: string;
}

export interface GenreResponse {
	id: number;
	name: string;
	slug: string;
}