import { create } from "zustand";

type PostType = "review" | "analysis";

type PostModalStore = {
	isOpen: boolean;
	type: PostType;
	open: (type: PostType) => void;
	close: () => void;
};

export const usePostModal = create<PostModalStore>((set) => ({
	isOpen: false,
	type: "review",

	open: (type) =>
		set({
			isOpen: true,
			type,
		}),

	close: () =>
		set({
			isOpen: false,
		}),
}));