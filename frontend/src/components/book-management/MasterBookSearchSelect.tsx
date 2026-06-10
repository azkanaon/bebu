"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check, BookOpen, Loader2 } from "lucide-react";
import clsx from "clsx";
import { getMasterBooksAPI } from "@/lib/api"; // 💡 Import API Anda di sini
import { BookResponse } from "@/types/book-management";

interface MasterBookSearchSelectProps {
	selectedValue: string;
	onSelect: (bookId: string) => void;
	isOpenModal: boolean; // 💡 Kita butuh tahu status modal induk terbuka atau tidak
}

export default function MasterBookSearchSelect({
	selectedValue,
	onSelect,
	isOpenModal,
}: MasterBookSearchSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [books, setBooks] = useState<BookResponse[]>([]); // 💡 State lokal menampung hasil dari API
	const [loading, setLoading] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	// Tutup dropdown jika klik di luar komponen
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Reset pencarian kata kunci saat dropdown ditutup
	useEffect(() => {
		if (!isOpen) {
			setSearchQuery("");
		}
	}, [isOpen]);

	// 🌟 EFFECT LIVE SEARCH KE BACKEND (Pindahan logika lama yang disempurnakan)
	useEffect(() => {
		if (!isOpenModal) return;

		const fetchBooksFromBackend = async (term: string) => {
			setLoading(true);
			try {
				const response = await getMasterBooksAPI({
					search: term,
					page: 1,
					limit: 50, // 💡 KITA SET LIMIT 50: Biar muat sangat banyak buku saat di-scroll
				});

				if (response && response.data) {
					setBooks(response.data);
				}
			} catch (err) {
				console.error(
					"Gagal memuat katalog buku master di dropdown",
					err,
				);
			} finally {
				setLoading(false);
			}
		};

		// Jika kolom pencarian kosong, langsung ambil 50 buku teratas tanpa delay
		if (searchQuery.trim() === "") {
			fetchBooksFromBackend("");
			return;
		}

		// Jika admin mengetik kueri, jalankan debounce 400ms
		const delayDebounceFn = setTimeout(() => {
			fetchBooksFromBackend(searchQuery.trim());
		}, 400);

		return () => clearTimeout(delayDebounceFn);
	}, [searchQuery, isOpenModal]);

	// Temukan buku yang sedang terpilih untuk ditampilkan di tombol utama
	const currentSelectedBook = books.find(
		(b) => String(b.book_id) === selectedValue,
	);

	return (
		<div ref={containerRef} className="relative w-full">
			{/* TRIGGER BUTTON UTAMA */}
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={clsx(
					"flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition-all duration-300 outline-none",
					isOpen
						? "border-amber-500/40 bg-amber-500/[0.01] text-white"
						: "border-white/5 bg-black/40 text-zinc-300 hover:border-white/10",
				)}
			>
				<div className="flex items-center gap-2 truncate pr-2">
					<BookOpen
						size={13}
						className="text-amber-400/80 shrink-0"
					/>
					<span className="truncate">
						{currentSelectedBook ? (
							<span className="text-zinc-200">
								ID #{currentSelectedBook.book_id} -{" "}
								{currentSelectedBook.title}
							</span>
						) : (
							<span className="text-zinc-500 italic">
								Choose a book...
							</span>
						)}
					</span>
				</div>
				<ChevronDown
					size={13}
					className={clsx(
						"text-zinc-600 shrink-0 transition-transform duration-300",
						isOpen && "rotate-180 text-amber-400",
					)}
				/>
			</button>

			{/* BOX DROPDOWN CONTAINER */}
			{isOpen && (
				<div className="absolute z-50 mt-1.5 max-h-64 w-full overflow-hidden rounded-xl border border-white/10 bg-[#09090B] shadow-2xl backdrop-blur-xl flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
					{/* SEARCH BOX DI DALAM DROPDOWN */}
					<div className="relative flex items-center border-b border-white/5 bg-black/20 px-2.5 py-2">
						<Search
							size={12}
							className="absolute left-5 text-zinc-500"
						/>
						<input
							type="text"
							autoFocus
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Ketik judul buku atau penulis untuk mencari..."
							className="w-full rounded-lg border border-white/5 bg-black/40 py-1.5 pl-7 pr-8 text-[11px] text-zinc-200 outline-none focus:border-amber-500/20"
						/>
						{loading && (
							<Loader2
								size={12}
								className="absolute right-5 animate-spin text-amber-400"
							/>
						)}
					</div>

					{/* LIST HASIL JELAJAH */}
					<div className="overflow-y-auto p-1 max-h-44 custom-scrollbar">
						{books.length === 0 && !loading ? (
							<div className="px-3 py-3 text-center text-[11px] text-zinc-500 italic">
								Buku tidak ditemukan dalam katalog
							</div>
						) : (
							books.map((book) => {
								const isSelected =
									String(book.book_id) === selectedValue;
								const authorsStr =
									book.authors
										?.map((a) => a.name)
										.join(", ") || "Unknown Author";

								return (
									<button
										key={book.book_id}
										type="button"
										onClick={() => {
											onSelect(String(book.book_id));
											setIsOpen(false);
										}}
										className={clsx(
											"flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-all duration-150 mb-0.5 last:mb-0",
											isSelected
												? "bg-amber-500/10 text-amber-400 font-medium"
												: "text-zinc-300 hover:bg-white/[0.04]",
										)}
									>
										<div className="flex flex-col truncate pr-2">
											<span className="truncate text-zinc-200 font-medium">
												{book.title}
											</span>
											<span className="text-[10px] text-zinc-500 truncate mt-0.5">
												ID #{book.book_id} •{" "}
												{authorsStr}
											</span>
										</div>
										{isSelected && (
											<Check
												size={12}
												className="text-amber-400 shrink-0"
											/>
										)}
									</button>
								);
							})
						)}
					</div>
				</div>
			)}
		</div>
	);
}
