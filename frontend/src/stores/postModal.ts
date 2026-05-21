import { create } from "zustand";

type PostType = "review" | "analysis";

type Book = {
	id: number;
	title: string;
};

type PostModalStore = {
	isOpen: boolean;
	type: PostType;
	initialBook: Book | null; 
	open: (type: PostType, book?: Book | null) => void;
	close: () => void;
};

export const usePostModal = create<PostModalStore>((set) => ({
	isOpen: false,
	type: "review",
	initialBook: null,

	open: (type, book = null) =>
		set({
			isOpen: true,
			type,
			initialBook: book,
		}),

	close: () =>
		set({
			isOpen: false,
			initialBook: null, 
		}),
}));
