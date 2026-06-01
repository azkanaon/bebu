"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Plus } from "lucide-react";
import clsx from "clsx";
import { searchGenresAPI } from "@/lib/api";
import { GenreResponse } from "@/types/book-management";

interface GenreRowSelectProps {
	isEditMode: boolean;
	allSelectedGenreIds: number[];
	onSelect: (genre: GenreResponse) => void;
}

export default function GenreRowSelect({
	isEditMode,
	allSelectedGenreIds,
	onSelect,
}: GenreRowSelectProps) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<GenreResponse[]>([]);
	const [loading, setLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	// Menangani penutupan dropdown saat klik di luar komponen
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

	// Debounce Search Logic
	useEffect(() => {
		if (!query.trim()) {
			setResults([]);
			return;
		}

		const delayDebounceFn = setTimeout(async () => {
			setLoading(true);
			try {
				const res = await searchGenresAPI(query);
				if (res?.data) {
					setResults(res.data);
				}
			} catch (err) {
				console.error("Gagal mencari genre:", err);
			} finally {
				setLoading(false);
			}
		}, 300); // Tunggu 300ms setelah user berhenti mengetik

		return () => clearTimeout(delayDebounceFn);
	}, [query]);

	// Ekstrak nama query untuk tombol custom create
	const trimmedQuery = query.trim();

	// 🌟 Periksa apakah text yang sedang diketik user persis sama dengan salah satu hasil dari database
	const exactMatchFound = results.some(
		(g) => g.name.toLowerCase() === trimmedQuery.toLowerCase(),
	);

	return (
		<div ref={containerRef} className="relative w-full">
			<div className="relative flex items-center">
				<Search size={14} className="absolute left-3 text-zinc-500" />
				<input
					type="text"
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setIsOpen(true);
					}}
					onFocus={() => setIsOpen(true)}
					placeholder="Type to search or create genre..."
					className={clsx(
						"w-full rounded-xl border border-white/10 bg-white/[0.02] pl-9 pr-9 py-2 text-zinc-200 outline-none transition-all duration-300 text-xs",
						isEditMode
							? "focus:border-blue-500/40 focus:bg-blue-500/[0.02]"
							: "focus:border-emerald-500/40 focus:bg-emerald-500/[0.02]",
					)}
				/>
				{loading && (
					<Loader2
						size={14}
						className="absolute right-3 animate-spin text-zinc-500"
					/>
				)}
			</div>

			{/* DROPDOWN REKOMENDASI */}
			{isOpen && trimmedQuery !== "" && (
				<div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#09090B] p-1 shadow-xl backdrop-blur-xl custom-scrollbar">
					{loading ? (
						<div className="px-3 py-2 text-[11px] text-zinc-500 italic">
							Searching database...
						</div>
					) : (
						<>
							{/* 1. LIST HASIL PENCARIAN DARI DATABASE */}
							{results.map((genre) => {
								const isAlreadySelected =
									allSelectedGenreIds.includes(genre.id);
								return (
									<button
										key={genre.id}
										type="button"
										disabled={isAlreadySelected}
										onClick={() => {
											onSelect(genre);
											setQuery(""); // Reset input text setelah dipilih
											setIsOpen(false);
										}}
										className={clsx(
											"flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-all duration-150",
											isAlreadySelected
												? "opacity-40 cursor-not-allowed bg-zinc-900/30 text-zinc-500"
												: "text-zinc-300 hover:bg-white/[0.04] hover:text-white",
										)}
									>
										<span>{genre.name}</span>
										{isAlreadySelected && (
											<span className="text-[9px] uppercase tracking-wider text-zinc-600 font-semibold">
												Added
											</span>
										)}
									</button>
								);
							})}

							{/* 2. OPTION UTK MEMBUAT GENRE BARU DINAMIS */}
							{/* Muncul jika tidak ada hasil sama sekali ATAU nama yang diketik belum ada padanannya yang pas di DB */}
							{!exactMatchFound && (
								<button
									type="button"
									onClick={() => {
										// Buat slug sederhana dari text input untuk memenuhi kontrak interface GenreResponse
										const temporarySlug = trimmedQuery
											.toLowerCase()
											.replace(/[^a-z0-9]+/g, "-") // Ganti spasi/karakter non-alfanumerik dengan dash (-)
											.replace(/^-+|-+$/g, ""); // Hapus dash di awal atau akhir kata jika ada

										onSelect({
											id: Date.now(), // ID unik sementara untuk state frontend
											name: trimmedQuery,
											slug: temporarySlug, // Memenuhi kriteria tipe data GenreResponse
										});

										setQuery("");
										setIsOpen(false);
									}}
									className={clsx(
										"flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium border-t border-white/5 mt-1 transition-all duration-150",
										isEditMode
											? "text-blue-400 hover:bg-blue-500/10"
											: "text-emerald-400 hover:bg-emerald-500/10",
									)}
								>
									<Plus size={12} />
									<span>
										Create new genre &quot;{trimmedQuery}
										&quot;
									</span>
								</button>
							)}
						</>
					)}
				</div>
			)}
		</div>
	);
}
