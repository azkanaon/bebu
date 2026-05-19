export type BookFiltersResponse = {
	genres: string[];
	authors: string[];
	languages: string[];
};

export type BookSearchItem = {
	public_id: string;
	title: string;
	synopsis: string;
	cover_img_url: string;
	publication_year: number;
	language: string;
	authors: string[];
	genres: string[];
	total_pages: number;
	rating: number;
};

export type SearchBooksResponse = {
	books: BookSearchItem[];
	page: number;
	limit: number;
	total: number;
	total_pages: number;
};

export type PopularBookItem = {
	public_id: string;
	title: string;
	cover_img_url: string;
	rating: number;
	total_pages: number;
	authors: string[];
	popularity_score: number;
};

export type PopularBooksResponse = {
	range: string;
	books: PopularBookItem[];
};

export type HighlyRatedBookItem = {
	public_id: string;
	title: string;
	cover_img_url: string;
	rating: number;
	weighted_score: number;
	total_reviews: number;
	total_pages: number;
	authors: string[];
};

export type HighlyRatedBooksResponse = {
	books: HighlyRatedBookItem[];
};

export type AllBooksResponse = {
	books: BookSearchItem[];
	page: number;
	limit: number;
	total: number;
	total_pages: number;
};