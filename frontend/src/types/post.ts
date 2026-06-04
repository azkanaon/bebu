export interface CommentType {
	id: number;
	user_id: number;
	user_public_id: string;
	username: string;
	avatar: string;
	comment: string;
	likeCount: number;
	is_liked: boolean;
	replies?: CommentType[] | null;
	created_at: string;
	parent_comment_id?: number | null;
}

export interface CreateCommentRequest {
  post_id: number;
  parent_comment_id: number | null;
  comment: string;
}

export type PostType = "review" | "analysis";

export interface BasePost {
  id: number;
  post_public_id: string;
  type: PostType;
  user: {
    username: string;
    displayName: string;
    avatar: string;
    publicID: string;
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
    slug: string;
  };
  is_liked: boolean;
  is_saved: boolean;
}

export interface CategoryResponse {
  id: number;
  name: string;
}

export interface AnalysisPostType extends BasePost {
	type: "analysis";
	book: {
		title: string;
		cover: string;
		slug: string;
	};
	image?: string;
	likes: number;
	is_liked: boolean;
	is_saved: boolean;
	categories: CategoryResponse[];
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

export interface ShareRequest {
  post_id: number;
  receiver_ids: number[];
  message?: string; // Optional pesan tambahan
}

export interface ShareResponse {
  message: string;
  count: number;
}

export interface UserSearchResponse {
  id: number;
  username: string;
  display_name: string;
  avatar: string;
}

export interface GenericResponse<T> {
  status: string;
  data: T;
}