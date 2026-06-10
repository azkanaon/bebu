"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Book = {
	id: number; // 🔥 ubah ke number (biar cocok backend)
	title: string;
};

type BookSelectProps = {
	value: Book | null;
	onChange: (v: Book | null) => void;
	defaultBook?: Book | null; // 👈 Tambahkan prop opsional untuk auto-select dari Profil Buku
};

export default function BookSelect({ value, onChange, defaultBook = null }: BookSelectProps) {
	const [books, setBooks] = useState<Book[]>([]);
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [highlight, setHighlight] = useState(0);

	const containerRef = useRef<HTMLDivElement>(null);

	const filtered = books.filter((b) =>
		b.title.toLowerCase().includes(query.toLowerCase()),
	);

	useEffect(() => {
		if (defaultBook && !value) {
			onChange(defaultBook);
		}
	}, [defaultBook, value, onChange]);

	// 🔥 FETCH DATA
	useEffect(() => {
		const fetchBooks = async () => {
			try {
				const res = await fetch("http://localhost:8080/api/v1/books");
				const data = await res.json();
				setBooks(data.data);
			} catch (err) {
				console.error("Gagal memuat daftar buku global:", err);
			}
		};

		if (!defaultBook) {
			fetchBooks();
		}
	}, [defaultBook]);

	// ✅ klik luar = close
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const isLocked = !!defaultBook;

	return (
		<div ref={containerRef} className="relative">
			{/* Trigger */}
			<motion.div
				whileTap={isLocked ? {} : { scale: 0.98 }}
				onClick={() => !isLocked && setOpen((prev) => !prev)}
				className="
w-full p-3 rounded-xl cursor-pointer
bg-white/5
border border-white/10
hover:border-white/20
transition
flex justify-between items-center
"
			>
				<span className={`${value ? "text-white" : "text-gray-400"}`}>
					{value ? value.title : "Choose a book..."}
				</span>

				{!isLocked && (
					<motion.span
						animate={{ rotate: open ? 180 : 0 }}
						className="text-gray-400 text-xs"
					>
						▼
					</motion.span>
				)}
			</motion.div>

			{/* Dropdown */}
			<AnimatePresence>
				{open && !isLocked && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: -10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: -10 }}
						transition={{ duration: 0.14 }}
						className="
							absolute mt-2 w-full z-50
							rounded-2xl p-3
							bg-[#020617]/95
							backdrop-blur-xl
							border border-white/10
							shadow-[0_20px_60px_rgba(0,0,0,0.6)]
						"
					>
						{/* Search Input */}
						<input
							autoFocus
							value={query}
							onChange={(e) => {
								setQuery(e.target.value);
								setHighlight(0);
							}}
							onKeyDown={(e) => {
								if (e.key === "ArrowDown") {
									setHighlight((prev) => Math.min(prev + 1, filtered.length - 1));
								}
								if (e.key === "ArrowUp") {
									setHighlight((prev) => Math.max(prev - 1, 0));
								}
								if (e.key === "Enter") {
									const selected = filtered[highlight];
									if (selected) {
										onChange(selected);
										setOpen(false);
										setQuery("");
									}
								}
							}}
							placeholder="Cari judul buku..."
							className="
								w-full p-2.5 mb-2 rounded-xl text-xs
								bg-white/5 border border-white/10
								focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
								outline-none transition text-white
							"
						/>

						{/* List Items */}
						<div className="max-h-48 overflow-y-auto pr-1 space-y-0.5 custom-scrollbar">
							{filtered.length === 0 && (
								<div className="text-xs text-gray-500 p-3 text-center">
									Buku tidak ditemukan 😢
								</div>
							)}

							{filtered.map((book, i) => {
								const isActive = i === highlight;
								const isSelected = value?.id === book.id;

								return (
									<div
										key={book.id}
										onClick={() => {
											onChange(book);
											setOpen(false);
											setQuery("");
										}}
										className={`
											flex items-center justify-between
											p-2 px-3 rounded-lg cursor-pointer text-xs transition
											${isActive ? "bg-blue-500/20 text-white" : "hover:bg-white/5 text-gray-300"}
										`}
									>
										<span className={isSelected ? "text-blue-400 font-medium" : ""}>
											{book.title}
										</span>

										{isSelected && (
											<span className="text-blue-400 text-[10px]">✔</span>
										)}
									</div>
								);
							})}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}