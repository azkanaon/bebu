"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

type Book = {
	id: number;
	title: string;
	genre: string;
	rating: number;
	cover: string;
};

export function TrendingBooks() {
	const [books, setBooks] = useState<Book[]>([]);
	const [activeIndex, setActiveIndex] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		fetch("http://localhost:8080/api/v1/books/trending")
			.then((res) => res.json())
			.then((data) => setBooks(Array.isArray(data) ? data : []))
			.catch(() => setBooks([]));
	}, []);

	// scroll ke posisi active (center-ish)
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const cardWidth = 200;
		container.scrollTo({
			left: activeIndex * cardWidth,
			behavior: "smooth",
		});
	}, [activeIndex]);

	const scrollLeft = () => {
		setActiveIndex((prev) => (prev === 0 ? books.length - 1 : prev - 1));
	};

	const scrollRight = () => {
		setActiveIndex((prev) => (prev + 1) % books.length);
	};

	return (
		<div className="bg-right-bar p-4 rounded-2xl border border-white/10 shadow-lg">
			<h2 className="font-semibold text-lg text-white mb-2">
				🔥 Trending Books
			</h2>

			<div className="relative">
				{/* LEFT BUTTON */}
				<button
					onClick={scrollLeft}
					className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black text-white p-2 rounded-full"
				>
					‹
				</button>

				{/* RIGHT BUTTON */}
				<button
					onClick={scrollRight}
					className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black text-white p-2 rounded-full"
				>
					›
				</button>

				{/* CAROUSEL */}
				<div
					ref={containerRef}
					className="flex gap-4 overflow-x-auto px-10 scroll-smooth no-scrollbar"
				>
					{books.map((b, index) => {
						const isActive = index === activeIndex;
						const distance = Math.abs(index - activeIndex);

						return (
							<motion.div
								key={b.id}
								animate={{
									scale: isActive ? 1 : 0.85,
									opacity: distance > 2 ? 0.3 : 1,
									filter: isActive
										? "blur(0px)"
										: "blur(2px)",
								}}
								transition={{ type: "spring", stiffness: 200 }}
								className="min-w-[180px] flex-shrink-0"
							>
								<div className="relative w-[180px] h-[240px] rounded-xl overflow-hidden border border-white/10">
									<Image
										src={b.cover}
										alt={b.title}
										fill
										className="object-cover"
										unoptimized
									/>

									<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

									<div className="absolute bottom-0 p-3">
										<p className="text-sm font-semibold text-white line-clamp-2">
											{b.title}
										</p>
										<p className="text-xs text-gray-300 line-clamp-1">
											{b.genre}
										</p>
										<div className="text-yellow-300 text-xs mt-1">
											⭐ {b.rating.toFixed(1)}
										</div>
									</div>

									<div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
										#{index + 1}
									</div>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
