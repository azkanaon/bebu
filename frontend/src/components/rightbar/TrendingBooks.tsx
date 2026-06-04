"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { getPopularBooksAPI } from "@/lib/api"; 
import { PopularBookItem } from "@/types/book";

export function TrendingBooks() {
	const [books, setBooks] = useState<PopularBookItem[]>([]);
	const [activeIndex, setActiveIndex] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const containerRef = useRef<HTMLDivElement>(null);

	// Fetch data dari API Asli menggunakan range "7d" agar relevan sebagai Trending
	useEffect(() => {
		const fetchTrendingBooks = async () => {
			try {
				setIsLoading(true);
				const data = await getPopularBooksAPI("all");
				// Sesuaikan dengan response API: data.books atau jika langsung array jadinya (data || [])
				setBooks(data.books || data || []);
			} catch (error) {
				console.error("Failed to fetch trending books:", error);
				setBooks([]);
			} finally {
				setIsLoading(false);
			}
		};

		fetchTrendingBooks();
	}, []);

	// Scroll ke posisi active (center-ish)
	useEffect(() => {
		const container = containerRef.current;
		if (!container || books.length === 0) return;

		const cardWidth = 196; // 180px width + 16px (gap-4)
		container.scrollTo({
			left: activeIndex * cardWidth,
			behavior: "smooth",
		});
	}, [activeIndex, books.length]);

	const displayCount = Math.min(5, books.length);
	const scrollLeft = () => {
		if (displayCount === 0) return;
		setActiveIndex((prev) => (prev === 0 ? displayCount - 1 : prev - 1));
	};

	const scrollRight = () => {
		if (displayCount === 0) return;
		setActiveIndex((prev) => (prev + 1) % displayCount);
	};

	// State Loading State Biar Tampilan Bagus Saat Menunggu BE
	if (isLoading) {
		return (
			<div className="bg-right-bar p-4 rounded-2xl border border-white/10 shadow-lg animate-pulse">
				<div className="h-6 w-36 bg-gray-700 rounded mb-4" />
				<div className="w-[180px] h-[240px] bg-gray-800 rounded-xl mx-auto border border-white/5" />
			</div>
		);
	}

	// Jangan render apapun jika data kosong
	if (books.length === 0) return null;

	return (
		<div className="bg-right-bar p-4 rounded-2xl border border-white/10 shadow-lg">
			<h2 className="font-semibold text-lg text-white mb-2 flex items-center gap-2">
				🔥 Trending Books
			</h2>

			<div className="relative">
				{/* LEFT BUTTON */}
				<button
					onClick={scrollLeft}
					className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black text-white p-2 rounded-full backdrop-blur-sm transition-colors text-sm font-bold"
				>
					‹
				</button>

				{/* RIGHT BUTTON */}
				<button
					onClick={scrollRight}
					className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black text-white p-2 rounded-full backdrop-blur-sm transition-colors text-sm font-bold"
				>
					›
				</button>

				{/* CAROUSEL */}
				<div
					ref={containerRef}
					className="flex gap-4 overflow-x-auto px-10 scroll-smooth no-scrollbar"
				>
					{books.slice(0, 5).map((b, index) => {
						const isActive = index === activeIndex;
						const distance = Math.abs(index - activeIndex);

						return (
							<motion.div
								key={b.public_id || b.slug || index}
								animate={{
									scale: isActive ? 1 : 0.85,
									opacity: distance > 2 ? 0.3 : 1,
									filter: isActive
										? "blur(0px)"
										: "blur(1.5px)",
								}}
								transition={{
									type: "spring",
									stiffness: 220,
									damping: 20,
								}}
								className="min-w-[180px] flex-shrink-0"
							>
								{/* ✅ Ganti <div> lama menjadi <Link> dan arahkan ke /books/[slug] */}
								<Link
									href={`/books/${b.slug}`}
									className="relative block w-[180px] h-[240px] rounded-xl overflow-hidden border border-white/10 cursor-pointer group"
								>
									<Image
										src={b.cover_img_url}
										alt={b.title}
										fill
										className="object-cover transition-transform duration-300 group-hover:scale-105" // 💡 Efek zoom sedikit pas di-hover (opsional)
									/>

									<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

									<div className="absolute bottom-0 p-3 w-full">
										<p className="text-sm font-semibold text-white line-clamp-2 leading-tight">
											{b.title}
										</p>
										<p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
											{b.authors?.[0] || "Unknown Author"}
										</p>
										<div className="text-yellow-400 text-xs mt-1 font-medium flex items-center gap-1">
											⭐{" "}
											{Number(b.rating || 0).toFixed(1)}
										</div>
									</div>

									<div className="absolute top-2 left-2 bg-black/75 border border-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
										#{index + 1}
									</div>
								</Link>
							</motion.div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
