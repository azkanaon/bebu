// src/types/post.ts

export interface CommentType {
  id: number;
  user_id: number;
  user_public_id: string;
  username: string;
  avatar: string;
  comment: string;
  likeCount: number;
  isLiked: boolean;
  replies?: CommentType[] | null;
  created_at: string;
}

export interface CreateCommentRequest {
  post_id: number;
  parent_comment_id: number | null;
  comment: string;
}

export type PostType = "review" | "analysis";

export interface BasePost {
  id: number;
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

  comment_list?: CommentType[];
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
  is_liked: boolean;
  is_saved: boolean;
}

export interface AnalysisPostType extends BasePost {
  type: "analysis";
  book: {
    title: string;
    cover: string;
  };
  image?: string;
  likes: number;
  is_liked: boolean;
  is_saved: boolean;
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