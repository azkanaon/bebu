"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

type Category = {
	id: number;
	name: string;
	is_favorited: boolean;
};

export function CategoryModal({
	onClose,
	onUpdate,
}: {
	onClose: () => void;
	onUpdate: () => void;
}) {
	const [categories, setCategories] = useState<Category[]>([]);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	// 🔥 Fetch data
	useEffect(() => {
		fetch("http://localhost:8080/api/v1/categories")
			.then((res) => res.json())
			.then((data) => setCategories(data))
			.catch(() => toast.error("Failed to load categories"));
	}, []);

	// 🔥 ESC close
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [onClose]);

	// 🔥 Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);

		return () => clearTimeout(timer);
	}, [search]);

	// 🔥 Toggle favorite
	const toggleFavorite = async (id: number, isFav: boolean) => {
		const res = await fetch(
			`http://localhost:8080/api/v1/categories/${id}/favorite`,
			{
				method: isFav ? "DELETE" : "POST",
			},
		);

		if (!res.ok) {
			const err = await res.json();
			toast.error(err.error);
			return;
		}

		setCategories((prev) =>
			prev.map((c) => (c.id === id ? { ...c, is_favorited: !isFav } : c)),
		);

		toast.success(isFav ? "Removed from favorites" : "Added to favorites");

		onUpdate();
	};

	// 🔥 Filter
	const filtered = categories.filter((c) =>
		c.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
	);

	const favoriteCount = categories.filter((c) => c.is_favorited).length;
	const maxReached = favoriteCount >= 10;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* BACKDROP */}
			<div
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* MODAL */}
			<div
				className="relative w-[500px] max-h-[80vh] rounded-xl p-4
				bg-gradient-to-b from-[#0f172a] to-[#020617]
				border border-white/10 shadow-2xl"
			>
				{/* CLOSE */}
				<button
					onClick={onClose}
					className="absolute top-3 right-3 text-gray-400 hover:text-white transition hover:rotate-90"
				>
					✕
				</button>

				{/* HEADER */}
				<div className="mb-4">
					<h2 className="text-lg font-semibold">Select Categories</h2>
					<p className="text-xs text-gray-400 mt-1">
						{favoriteCount}/10 selected
					</p>
				</div>

				{/* SEARCH */}
				<input
					type="text"
					placeholder="Search category..."
					className="
						w-full px-3 py-2 mb-3 rounded-lg
						bg-white/5 border border-white/10
						focus:border-blue-400 focus:bg-white/10
						outline-none transition
					"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>

				{/* WARNING */}
				{maxReached && (
					<p className="text-xs text-yellow-400 mb-2">
						Maximum 10 categories reached
					</p>
				)}

				{/* LIST */}
				<div className="overflow-y-auto max-h-[55vh] space-y-1 pr-1 custom-scrollbar">
					<AnimatePresence>
						{filtered.map((c) => (
							<motion.div
								key={c.id}
								layout
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.2 }}
								className={`
									flex justify-between items-center
									px-3 py-2 rounded-lg
									cursor-pointer
									transition-all
									hover:bg-white/5 hover:translate-x-1

									${c.is_favorited ? "bg-blue-500/10 border border-blue-400/20" : ""}
								`}
							>
								<span>{c.name}</span>

								<button
									disabled={!c.is_favorited && maxReached}
									onClick={() =>
										toggleFavorite(c.id, c.is_favorited)
									}
									className={`text-xs px-2 py-1 rounded-md transition ${
										c.is_favorited
											? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
											: maxReached
												? "bg-gray-500/10 text-gray-500 cursor-not-allowed"
												: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
									}`}
								>
									{c.is_favorited ? "Added" : "Add"}
								</button>
							</motion.div>
						))}
					</AnimatePresence>

					{/* EMPTY */}
					{filtered.length === 0 && (
						<p className="text-sm text-gray-400 text-center py-4">
							No categories found
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
