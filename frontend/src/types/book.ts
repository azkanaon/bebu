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
	slug: string;
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
	slug: string;
	cover_img_url: string;
	rating: number;
	total_pages: number;
	authors: string[];
	popularity_score?: number;
	publication_year: number;
};

export type PopularBooksResponse = {
	range: string;
	books: PopularBookItem[];
};

export type HighlyRatedBookItem = {
	public_id: string;
	title: string;
	slug: string;
	cover_img_url: string;
	rating: number;
	weighted_score: number;
	total_reviews: number;
	total_pages: number;
	authors: string[];
	publication_year: number;
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

/* --- BOOK PROFILE --- */

export type AuthorDTO = {
	public_id: string;
	author_name: string;
	slug: string;
};

export type GenreDTO = {
	genre_name: string;
	slug: string;
};

export type BookStatDTO = {
	overall_rating: number;
	total_rating_sum: number;
	total_reviews: number;
	total_posts: number;
	rating_1_count: number;
	rating_2_count: number;
	rating_3_count: number;
	rating_4_count: number;
	rating_5_count: number;
};

export type BookProfileData = {
	book_id: number;
	public_id: string;
	title: string;
	synopsis: string;
	cover_img_url: string;
	publication_year: number;
	language: string;
	total_pages: number;
	slug: string;
	google_book_id: string;
	authors: AuthorDTO[];
	genres: GenreDTO[];
	stats: BookStatDTO;
};

/* --- BOOK PROFILE --- */

export type BookProfileResponse = {
	status: string;
	message: string;
	data: BookProfileData;
};

export type RecommendationBookItem = {
	public_id: string;
	title: string;
	cover_img_url: string;
	first_author: string;
	total_pages: number;
	publication_year: number;
	slug: string;
	rating: number;
};

export type BookRecommendationsData = {
	genre_recommendations: RecommendationBookItem[] | null;
	author_recommendations: RecommendationBookItem[] | null;
};

export type BookRecommendationsResponse = {
	status: string;
	message: string;
	data: BookRecommendationsData;
};

// Postingan
type PostUser = {
	publicID: string;
	username?: string;
	displayName: string;
	avatar: string;
};

export type BookReviewPostType = {
	id: number;
	post_public_id: string;
	type: "review";
	createdAt: string;
	content: string;
	is_liked: boolean;
	is_saved: boolean;
	rating: number;
	likes: number;
	comments: number;
	shares: number;
	user: PostUser;
	book: {
		title: string;
		author: string;
		pages: number;
		cover: string;
		genres: string[];
		rating: number;
	};
};

export type BookAnalysisPostType = {
	id: number;
	post_public_id: string;
	type: "analysis";
	content: string;
	image: string;
	createdAt: string;
	is_liked: boolean;
	is_saved: boolean;
	likes: number;
	comments: number;
	shares: number;
	user: PostUser;
	book: {
		title: string;
		cover: string;
	};
	categories: { id: number; name: string }[];
};

export type BookPostsResponse = {
	status: string;
	message: string;
	data: (BookReviewPostType | BookAnalysisPostType)[];
};