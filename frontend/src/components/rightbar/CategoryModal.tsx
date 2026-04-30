"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

	// Fetch categories
	useEffect(() => {
		fetch("http://localhost:8080/api/v1/categories")
			.then((res) => res.json())
			.then((data) => setCategories(data))
			.catch(() => toast.error("Failed to load categories"));
	}, []);

	// ESC close
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};

		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [onClose]);

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);

		return () => clearTimeout(timer);
	}, [search]);

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

	const filtered = categories.filter((c) =>
		c.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
	);

	const favoriteCount = categories.filter((c) => c.is_favorited).length;

	const maxReached = favoriteCount >= 10;

	if (typeof window === "undefined") return null;

	return createPortal(
		<div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
			{/* Backdrop */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onClick={onClose}
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
			/>

			{/* Modal */}
			<motion.div
				initial={{ opacity: 0, y: 20, scale: 0.96 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: 20, scale: 0.96 }}
				transition={{
					duration: 0.22,
					ease: "easeOut",
				}}
				className="
					relative z-10 w-full max-w-[500px]
					max-h-[80vh] rounded-2xl p-4
					bg-gradient-to-b from-[#0f172a] to-[#020617]
					border border-white/10 shadow-2xl
				"
			>
				{/* Close */}
				<button
					onClick={onClose}
					className="absolute top-3 right-3 text-gray-400 hover:text-white transition"
				>
					✕
				</button>

				{/* Header */}
				<div className="mb-4">
					<h2 className="text-lg font-semibold">Select Categories</h2>

					<p className="text-xs text-gray-400 mt-1">
						{favoriteCount}/10 selected
					</p>
				</div>

				{/* Search */}
				<input
					type="text"
					placeholder="Search category..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="
						w-full px-3 py-2 mb-3 rounded-lg
						bg-white/5 border border-white/10
						focus:border-blue-400 focus:bg-white/10
						outline-none transition
					"
				/>

				{/* Warning */}
				{maxReached && (
					<p className="text-xs text-yellow-400 mb-2">
						Maximum 10 categories reached
					</p>
				)}

				{/* List */}
				<div className="overflow-y-auto max-h-[55vh] space-y-1 pr-1 custom-scrollbar">
					<AnimatePresence>
						{filtered.map((c) => (
							<motion.div
								key={c.id}
								layout
								initial={{
									opacity: 0,
									y: 8,
								}}
								animate={{
									opacity: 1,
									y: 0,
								}}
								exit={{
									opacity: 0,
									y: -8,
								}}
								transition={{
									duration: 0.18,
								}}
								className={`
									flex justify-between items-center
									px-3 py-2 rounded-lg
									transition-all
									hover:bg-white/5

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

					{filtered.length === 0 && (
						<p className="text-sm text-gray-400 text-center py-4">
							No categories found
						</p>
					)}
				</div>
			</motion.div>
		</div>,
		document.body,
	);
}
