"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/useDebounce";
import { searchAuthorsAPI } from "@/lib/api";
import { AuthorResponse } from "@/types/book-management";

interface AuthorRowSelectProps {
	value: string;
	onChange: (newName: string) => void;
	placeholder: string;
	isEditMode: boolean;
	index: number;
	allSelectedAuthors: string[];
}

export default function AuthorRowSelect({
	value,
	onChange,
	placeholder,
	isEditMode,
	allSelectedAuthors,
}: AuthorRowSelectProps) {
	// Inisialisasi awal menggunakan value yang diberikan parent
	const [query, setQuery] = useState(value);
	const [open, setOpen] = useState(false);
	const [focused, setFocused] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);

	const containerRef = useRef<HTMLDivElement>(null);
	const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

	const debounced = useDebounce(query, 300);

	// 🌟 Perbaikan Key SWR: Menyesuaikan path url menjadi /api/v1/authors/search
	const { data, error, isLoading } = useSWR(
		debounced && debounced.trim().length > 0
			? [`/v1/authors/search`, debounced] // Key identifikasi cache SWR
			: null,
		([, q]) => searchAuthorsAPI(q), // Memanggil fungsi API kustom Anda yang baru
	);

	const suggestions: AuthorResponse[] = data?.data || [];

	// Mencegah lag/reset debounced saat admin mengetik dengan cepat
	useEffect(() => {
		if (value !== query) {
			setQuery(value);
		}
	}, [value]);

	// Filter data agar tidak memunculkan penulis yang sama persis dengan yang tertulis di box saat ini
	const filteredSuggestions = suggestions.filter(
		(auth) =>
			!allSelectedAuthors.some(
				(selectedName) =>
					selectedName.toLowerCase() === auth.name.toLowerCase(),
			),
	);

	// Logika memunculkan tombol "Buat Baru" jika text tidak ada kembarannya di databasesuggestions
	const showCreate =
		query.trim().length > 0 &&
		// Pastikan tidak ada di database suggestions asli
		!suggestions.some(
			(a) => a.name.toLowerCase() === query.trim().toLowerCase(),
		) &&
		// Pastikan tidak sedang dipilih di baris manapun dalam form saat ini
		!allSelectedAuthors.some(
			(existingName) =>
				existingName.toLowerCase() === query.trim().toLowerCase(),
		);

	const totalItems = filteredSuggestions.length + (showCreate ? 1 : 0);

	useEffect(() => {
		const el = itemsRef.current[activeIndex];
		if (el) {
			el.scrollIntoView({ block: "nearest" });
		}
	}, [activeIndex]);

	const selectAuthor = (name: string) => {
		setQuery(name);
		onChange(name);
		setOpen(false);
	};

	const createNewAuthor = () => {
		if (!query.trim()) return;
		onChange(query.trim());
		setOpen(false);
	};

	const activeColorText = isEditMode ? "text-blue-400" : "text-emerald-400";
	const activeBgHover = isEditMode ? "bg-blue-500/15" : "bg-emerald-500/15";
	const activeBgCreateHover = isEditMode
		? "bg-blue-500/10"
		: "bg-emerald-500/10";
	const activeBorder = isEditMode
		? "rgba(59,130,246,0.4)"
		: "rgba(16,185,129,0.4)";
	const activeShadow = isEditMode
		? "0 0 0 3px rgba(59,130,246,0.1)"
		: "0 0 0 3px rgba(16,185,129,0.1)";

	return (
		<div className="relative flex-1" ref={containerRef}>
			{/* INPUT FIELD CONTAINER */}
			<motion.div
				animate={{
					borderColor: focused
						? activeBorder
						: "rgba(255,255,255,0.1)",
					boxShadow: focused
						? activeShadow
						: "0 0 0 0px rgba(0,0,0,0)",
				}}
				className="
					relative rounded-xl border bg-black/20 
					transition duration-200 flex items-center backdrop-blur-xl
				"
			>
				<input
					type="text"
					required
					value={query}
					onFocus={() => {
						setFocused(true);
						setOpen(true);
					}}
					onBlur={() => {
						setFocused(false);
						// Memberi jeda aman agar klik item dropdown sempat tereksekusi
						setTimeout(() => setOpen(false), 250);
					}}
					onChange={(e) => {
						const val = e.target.value;
						setQuery(val);
						onChange(val); // Update langsung ke form parent state
						setOpen(true);
						setActiveIndex(0);
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
								selectAuthor(selected.name);
							} else if (showCreate) {
								createNewAuthor();
							}
						}

						if (e.key === "Escape") {
							setOpen(false);
						}
					}}
					placeholder={placeholder}
					className="w-full bg-transparent outline-none px-3.5 py-2 text-zinc-200 text-xs placeholder:text-zinc-600"
				/>

				{/* LOADING INDICATOR MINI DI UTK DETEKSI API */}
				{isLoading && (
					<div className="absolute right-3 h-3 w-3 rounded-full border border-zinc-500 border-t-transparent animate-spin" />
				)}
			</motion.div>

			{/* DROPDOWN SUGGESTIONS LIST */}
			<AnimatePresence>
				{open && query.trim() && totalItems > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 5, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 5, scale: 0.98 }}
						transition={{ duration: 0.15 }}
						className="
							absolute mt-2 w-full z-50
							rounded-xl bg-[#09090B]
							border border-white/10
							shadow-[0_12px_40px_rgba(0,0,0,0.7)]
							overflow-auto max-h-48 divide-y divide-white/[0.03]
						"
					>
						{filteredSuggestions.map((auth, index) => {
							const isActive = index === activeIndex;

							return (
								<div
									ref={(el) => {
										itemsRef.current[index] = el;
									}}
									key={auth.id}
									onMouseEnter={() => setActiveIndex(index)}
									// Menggunakan onMouseDown agar tereksekusi sebelum onBlur menutup dropdown
									onMouseDown={(e) => {
										e.preventDefault();
										selectAuthor(auth.name);
									}}
									className={`
										px-3.5 py-2.5 text-xs transition-colors duration-150 cursor-pointer
										${isActive ? `${activeBgHover} text-white font-medium` : "text-zinc-400 hover:bg-white/[0.02]"}
									`}
								>
									{auth.name}
								</div>
							);
						})}

						{/* KREASI AUTHOR BARU */}
						{showCreate && (
							<div
								ref={(el) => {
									itemsRef.current[
										filteredSuggestions.length
									] = el;
								}}
								onMouseEnter={() =>
									setActiveIndex(filteredSuggestions.length)
								}
								onMouseDown={(e) => {
									e.preventDefault();
									createNewAuthor();
								}}
								className={`
									px-3.5 py-2.5 text-xs cursor-pointer transition-colors duration-150
									${activeIndex === filteredSuggestions.length ? `${activeBgHover} text-white` : `${activeColorText} ${activeBgCreateHover}`}
								`}
							>
								Use &ldquo;
								<span className="font-semibold">{query}</span>
								&rdquo; as new author
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
