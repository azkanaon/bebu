// --- Master Books Types ---
export interface BookQueryParams {
	page: number;
	limit: number;
	search: string;
}

export interface SelectedAuthor {
	id?: number;
	name: string;
	is_new?: boolean;
}

export interface SelectedGenre {
	id?: number;
	name: string;
	is_new?: boolean;
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
	authors: AuthorResponse[];
	genres: GenreResponse[];
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
	
	author_ids: number[];
	new_author_names: string[];

	genre_ids: number[];
	new_genre_names: string[];
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

type Author = {
	id: number;
	name: string;
};

type Genre = {
	id: number;
	name: string;
};

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
	authors: Author[];
	genres: Genre[];
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
	admin_note: string;
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