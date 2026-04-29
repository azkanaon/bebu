// src/types/post.ts

export type PostType = "review" | "analysis";

export interface BasePost {
  id: string;
  type: PostType;
  user: {
    username: string;
    displayName: string;
    avatar: string;
  };
  createdAt: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  saved: boolean;
}

export interface ReviewPostType extends BasePost {
  type: "review";
  book: {
    title: string;
    author: string;
    pages: number;
    cover: string;
    genres: string[];
    rating: number;
  };
}

export interface AnalysisPostType extends BasePost {
  type: "analysis";
  book: {
    title: string;
    cover: string;
  };
  image?: string;
}

export type CreatePostPayload = {
	user_id: number;
	book_id: number;
	description: string;
	post_type: "review" | "analysis";
	rating: number;
	categories: string[];
	file?: File | null;
};