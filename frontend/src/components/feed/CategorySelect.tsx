"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useDebounce } from "@/hooks/useDebounce";
import { Category } from "@/types/category";
import { searchCategoriesAPI } from "@/lib/api";
import { CategoryResponse } from "@/types/post";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const MAX_CATEGORIES = 10;

type CategorySelectProps = {
	value: CategoryResponse[]; // 👈 Ubah dari Category[] menjadi CategoryResponse[]
	onChange: (value: CategoryResponse[]) => void; // 👈 Ubah ini juga
};

export default function CategorySelect({
	value,
	onChange,
}: CategorySelectProps) {
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const [focused, setFocused] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);

	const containerRef = useRef<HTMLDivElement>(null);
	const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

	const debounced = useDebounce(query, 300);

	const { data } = useSWR(
		debounced ? ["/v1/categories/search", debounced] : null,
		([, q]) => searchCategoriesAPI(q),
	);

	const suggestions: Category[] = data?.data || [];

	// ===== FILTER & STATE =====
	const selectedIds = new Set(value.map((v) => v.id));

	const filteredSuggestions = suggestions.map((cat) => ({
		...cat,
		disabled: selectedIds.has(cat.id),
	}));

	const showCreate =
		query.trim() &&
		!suggestions.find(
			(c) => c.name.toLowerCase() === query.toLowerCase(),
		) &&
		!value.find((v) => v.name.toLowerCase() === query.toLowerCase());

	const canAddMore = value.length < MAX_CATEGORIES;
	const canCreate = showCreate && canAddMore;

	const totalItems = filteredSuggestions.length + (canCreate ? 1 : 0);

	useEffect(() => {
		const el = itemsRef.current[activeIndex];
		if (el) {
			el.scrollIntoView({
				block: "nearest",
			});
		}
	}, [activeIndex]);

	// ===== ACTIONS =====
	const addCategory = (cat: Category) => {
		const exists = value.some(
			(v) => v.name.toLowerCase() === cat.name.toLowerCase(),
		);

		if (exists) return;
		if (!canAddMore) return;

		onChange([...value, cat]);
		setQuery("");
		setOpen(false);
	};

	const removeCategory = (id: number) => {
		onChange(value.filter((v) => v.id !== id));
	};

	const createNew = () => {
		if (!query.trim()) return;
		if (!canAddMore) return;

		const exists = value.some(
			(v) => v.name.toLowerCase() === query.toLowerCase(),
		);

		if (exists) return; // 🔥 penting

		const newCat: Category = {
			id: Date.now(),
			name: query,
			is_favorited: false,
		};

		onChange([...value, newCat]);
		setQuery("");
		setOpen(false);
	};

	return (
		<div className="relative">
			{/* INPUT CONTAINER */}
			<motion.div
				ref={containerRef}
				layout
				onClick={() => setOpen(true)}
				animate={{
					borderColor: focused
						? "rgba(168,85,247,0.6)"
						: "rgba(255,255,255,0.1)",
					boxShadow: focused
						? "0 0 0 3px rgba(168,85,247,0.15)"
						: "0 0 0 0px rgba(0,0,0,0)",
				}}
				className="
relative pt-4 px-4 pb-3 rounded-2xl
bg-gradient-to-b from-white/5 to-white/[0.03]
border
transition
flex flex-wrap gap-2
cursor-text
backdrop-blur-xl
"
			>
				<div
					className={`absolute top-2 right-3 text-xs ${
						value.length >= MAX_CATEGORIES
							? "text-red-400"
							: "text-gray-400"
					}`}
				>
					{value.length}/{MAX_CATEGORIES}
				</div>
				{/* CHIPS */}
				<LayoutGroup>
					{value.map((cat) => (
						<motion.div
							layout
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.8, opacity: 0 }}
							key={cat.id}
							className="
px-3 py-1 text-xs font-medium
rounded-full
bg-gradient-to-r from-purple-500/20 to-indigo-500/20
border border-purple-400/20
text-purple-300
flex items-center gap-2
"
						>
							{cat.name}
							<motion.span
								whileHover={{ scale: 1.2 }}
								whileTap={{ scale: 0.9 }}
								onClick={() => removeCategory(cat.id)}
								className="cursor-pointer opacity-70 hover:opacity-100"
							>
								✕
							</motion.span>
						</motion.div>
					))}
				</LayoutGroup>

				{/* INPUT */}
				<input
					value={query}
					disabled={!canAddMore}
					onFocus={() => {
						setFocused(true);
						setOpen(true);
					}}
					onBlur={() => {
						setFocused(false);
						setTimeout(() => setOpen(false), 150);
					}}
					onChange={(e) => {
						setQuery(e.target.value);
						setOpen(true);
					}}
					onKeyDown={(e) => {
						if (!open) return;

						if (e.key === "ArrowDown") {
							e.preventDefault();
							setActiveIndex((prev) =>
								prev < totalItems - 1 ? prev + 1 : prev,
							);
						}

						if (e.key === "ArrowUp") {
							e.preventDefault();
							setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
						}

						if (e.key === "Enter") {
							e.preventDefault();

							if (activeIndex < filteredSuggestions.length) {
								const selected =
									filteredSuggestions[activeIndex];

								if (!selected.disabled) {
									addCategory(selected);
								}
							} else if (canCreate) {
								createNew();
							}
						}

						if (e.key === "Escape") {
							setOpen(false);
						}
					}}
					className={`
bg-transparent outline-none text-sm flex-1 min-w-[120px]
text-white placeholder:text-gray-500
${!canAddMore ? "opacity-50 cursor-not-allowed" : ""}
`}
				/>
			</motion.div>

			{/* DROPDOWN */}
			<AnimatePresence>
				{open && query && (
					<motion.div
						initial={{ opacity: 0, y: 8, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 8, scale: 0.98 }}
						transition={{ duration: 0.18 }}
						className="
absolute mt-3 w-full z-50
rounded-2xl
bg-[#0f172a]/95
backdrop-blur-2xl
border border-white/10
shadow-[0_20px_60px_rgba(0,0,0,0.6)]
overflow-auto max-h-60
"
					>
						{filteredSuggestions.map((cat, index) => {
							const isActive = index === activeIndex;
							const isDisabled = cat.disabled;

							return (
								<div
									ref={(el) => {
										itemsRef.current[index] = el;
									}}
									key={cat.id}
									onMouseEnter={() => setActiveIndex(index)}
									onClick={() =>
										!isDisabled && addCategory(cat)
									}
									className={`
px-4 py-3 text-sm transition
${isDisabled ? "text-gray-500 cursor-not-allowed opacity-50" : "cursor-pointer"}
${
	isActive && !isDisabled
		? "bg-purple-500/15 text-white"
		: !isDisabled
			? "text-gray-300 hover:bg-white/5"
			: ""
}
`}
								>
									{cat.name}
									{isDisabled && " (Selected)"}
								</div>
							);
						})}

						{/* CREATE */}
						{canCreate && (
							<div
								ref={(el) => {
									itemsRef.current[
										filteredSuggestions.length
									] = el;
								}}
								onMouseEnter={() =>
									setActiveIndex(filteredSuggestions.length)
								}
								onClick={createNew}
								className={`
px-4 py-3 text-sm cursor-pointer border-t border-white/5 transition
${
	activeIndex === filteredSuggestions.length
		? "bg-purple-500/15 text-white"
		: "text-purple-400 hover:bg-purple-500/10"
}
`}
							>
								Buat{" "}
								<span className="font-semibold">{query}</span>
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
