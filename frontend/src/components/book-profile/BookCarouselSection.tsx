"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RecommendationBookItem } from "@/types/book";
import PopularBookCard from "../books/PopularBookCard";

type BookCarouselSectionProps = {
	title: string;
	description: string;
	books: RecommendationBookItem[];
};

export default function BookCarouselSection({
	title,
	description,
	books,
}: BookCarouselSectionProps) {
	const scrollRef = useRef<HTMLDivElement | null>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(true);

	const checkScroll = () => {
		if (!scrollRef.current) return;
		const el = scrollRef.current;
		setCanScrollLeft(el.scrollLeft > 0);
		setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
	};

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		checkScroll();
		el.addEventListener("scroll", checkScroll);
		return () => el.removeEventListener("scroll", checkScroll);
	}, [books]);

	const scroll = (direction: "left" | "right") => {
		if (!scrollRef.current) return;
		const container = scrollRef.current;
		const scrollAmount = container.clientWidth * 0.75;
		container.scrollBy({
			left: direction === "right" ? scrollAmount : -scrollAmount,
			behavior: "smooth",
		});
	};

	if (!books || books.length === 0) return null;

	return (
		// Di sini container pembungkus gelap & padding besar sudah dihapus sepenuhnya
		<section className="w-full space-y-4">
			{/* HEADER */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="text-[20px] font-semibold tracking-tight text-white">
						{title}
					</h2>
					<p className="mt-1 text-xs leading-relaxed text-gray-400">
						{description}
					</p>
				</div>

				{/* ARROWS */}
				<div className="flex items-center gap-1">
					<button
						onClick={() => scroll("left")}
						disabled={!canScrollLeft}
						className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gray-300 transition-all duration-200 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
					>
						<ChevronLeft size={12} />
					</button>
					<button
						onClick={() => scroll("right")}
						disabled={!canScrollRight}
						className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gray-300 transition-all duration-200 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
					>
						<ChevronRight size={12} />
					</button>
				</div>
			</div>

			{/* CONTENT */}
			<div className="w-full">
				<div
					ref={scrollRef}
					className="flex gap-3 overflow-x-hidden scroll-smooth pb-2"
				>
					{books.map((book) => (
						<PopularBookCard
							key={book.public_id}
							book={{
								public_id: book.public_id,
								title: book.title,
								cover_img_url: book.cover_img_url,
								rating: book.rating,
								total_pages: book.total_pages,
								authors: [book.first_author],
								publication_year: book.publication_year,
							}}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
