import { create } from "zustand";

interface PostInteraction {
	likes: number;
	is_liked: boolean;
	is_saved: boolean;
	shares: number;
}

interface PostState {
	// Dictionary untuk menyimpan data post berdasarkan ID
	interactions: Record<number, PostInteraction>;

	// Inisialisasi data post ke store
	initPost: (postId: number, initialData: PostInteraction) => void;

	// Logika toggle Like dengan perhitungan angka
	toggleLikeStore: (postId: number) => void;

	// Logika toggle Save
	toggleSaveStore: (postId: number) => void;

	addShareCountStore: (postId: number, count: number) => void;
}

export const usePostStore = create<PostState>((set) => ({
	interactions: {},

	initPost: (postId, initialData) =>
		set((state) => ({
			interactions: {
				...state.interactions,
				[postId]: state.interactions[postId] || initialData,
			},
		})),

	toggleLikeStore: (postId) =>
		set((state) => {
			const post = state.interactions[postId];
			if (!post) return state;

			const newIsLiked = !post.is_liked;
			return {
				interactions: {
					...state.interactions,
					[postId]: {
						...post,
						is_liked: newIsLiked,
						likes: newIsLiked ? post.likes + 1 : post.likes - 1,
					},
				},
			};
		}),

	toggleSaveStore: (postId) =>
		set((state) => ({
			interactions: {
				...state.interactions,
				[postId]: {
					...state.interactions[postId],
					is_saved: !state.interactions[postId]?.is_saved,
				},
			},
		})),

	addShareCountStore: (postId, count) =>
		set((state) => {
			const post = state.interactions[postId];
			if (!post) return state;
			return {
				interactions: {
					...state.interactions,
					[postId]: {
						...post,
						shares: post.shares + count,
					},
				},
			};
		}),
}));
