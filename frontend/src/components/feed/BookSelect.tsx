"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Book = {
	id: number; // 🔥 ubah ke number (biar cocok backend)
	title: string;
};

export default function BookSelect({
	value,
	onChange,
}: {
	value: Book | null;
	onChange: (v: Book | null) => void;
}) {
	const [books, setBooks] = useState<Book[]>([]);
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [highlight, setHighlight] = useState(0);

	const containerRef = useRef<HTMLDivElement>(null);

	const filtered = books.filter((b) =>
		b.title.toLowerCase().includes(query.toLowerCase()),
	);

	// 🔥 FETCH DATA
	useEffect(() => {
		const fetchBooks = async () => {
			try {
				const res = await fetch("http://localhost:8080/api/v1/books");
				const data = await res.json();
				setBooks(data.data);
			} catch (err) {
				console.error(err);
			}
		};

		fetchBooks();
	}, []);

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

	return (
		<div ref={containerRef} className="relative">
			{/* Trigger */}
			<motion.div
				whileTap={{ scale: 0.98 }}
				onClick={() => setOpen((prev) => !prev)}
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
					{value ? value.title : "Pilih Buku"}
				</span>

				<motion.span
					animate={{ rotate: open ? 180 : 0 }}
					className="text-gray-400 text-sm"
				>
					▼
				</motion.span>
			</motion.div>

			{/* Dropdown */}
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: -10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: -10 }}
						transition={{ duration: 0.18 }}
						className="
absolute mt-2 w-full z-50
rounded-2xl p-3
bg-[#020617]/95
backdrop-blur-xl
border border-white/10
shadow-[0_20px_60px_rgba(0,0,0,0.6)]
"
					>
						{/* Search */}
						<input
							autoFocus
							value={query}
							onChange={(e) => {
								setQuery(e.target.value);
								setHighlight(0);
							}}
							onKeyDown={(e) => {
								if (e.key === "ArrowDown") {
									setHighlight((prev) =>
										Math.min(prev + 1, filtered.length - 1),
									);
								}

								if (e.key === "ArrowUp") {
									setHighlight((prev) =>
										Math.max(prev - 1, 0),
									);
								}

								if (e.key === "Enter") {
									const selected = filtered[highlight];
									if (selected) {
										onChange(selected); // ✅ FIX
										setOpen(false);
										setQuery("");
									}
								}
							}}
							placeholder="Search book..."
							className="
w-full p-3 mb-3 rounded-lg text-sm
bg-white/5
border border-white/10
focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30
outline-none transition
"
						/>

						{/* List */}
						<div className="max-h-48 overflow-y-auto pr-1 space-y-1">
							{filtered.length === 0 && (
								<div className="text-sm text-gray-500 p-2 text-center">
									Tidak ditemukan 😢
								</div>
							)}

							{filtered.map((book, i) => {
								const isActive = i === highlight;
								const isSelected = value?.id === book.id; // ✅ FIX

								return (
									<motion.div
										key={book.id}
										onClick={() => {
											onChange(book); // ✅ FIX
											setOpen(false);
											setQuery("");
										}}
										whileHover={{ scale: 1.02 }}
										className={`
flex items-center justify-between
p-2 px-3 rounded-lg cursor-pointer text-sm
transition
${isActive ? "bg-blue-500/20" : "hover:bg-white/5"}
`}
									>
										<span
											className={`${
												isSelected
													? "text-blue-400"
													: "text-gray-200"
											}`}
										>
											{book.title}
										</span>

										{isSelected && (
											<span className="text-blue-400 text-xs">
												✔
											</span>
										)}
									</motion.div>
								);
							})}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
