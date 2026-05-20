"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getPopularBooksAPI } from "@/lib/api";

import { PopularBookItem } from "@/types/book";

import PopularBookCard from "./PopularBookCard";
import PopularRangeDropdown from "./PopularRangeDropdown";

type RangeType = "today" | "7d" | "30d" | "all";

export default function PopularBooksSection() {
	const [range, setRange] = useState<RangeType>("today");

	const [books, setBooks] = useState<PopularBookItem[]>([]);

	const [isLoading, setIsLoading] = useState(false);

	const scrollRef = useRef<HTMLDivElement | null>(null);

	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(true);

	const checkScroll = () => {
		if (!scrollRef.current) return;

		const el = scrollRef.current;

		setCanScrollLeft(el.scrollLeft > 0);

		setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
	};

	// Check Scroll Mentok atau Tidak
	useEffect(() => {
		const el = scrollRef.current;

		if (!el) return;

		checkScroll();

		el.addEventListener("scroll", checkScroll);

		return () => {
			el.removeEventListener("scroll", checkScroll);
		};
	}, [books]);

	useEffect(() => {
		const fetchPopularBooks = async () => {
			try {
				setIsLoading(true);

				const data = await getPopularBooksAPI(range);

				setBooks(data.books || []);
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchPopularBooks();
	}, [range]);

	const scroll = (direction: "left" | "right") => {
		if (!scrollRef.current) return;

		const cardWidth = 240;
		const gap = 20;

		const scrollAmount = (cardWidth + gap) * 1.5;

		scrollRef.current.scrollBy({
			left: direction === "right" ? scrollAmount : -scrollAmount,
			behavior: "smooth",
		});
	};

	return (
		<section
			className="
				rounded-2xl
				border
				border-white/[0.06]
				bg-[#0B1120]/70
				p-5
				backdrop-blur-xl
			"
		>
			{/* HEADER */}
			<div
				className="
					flex
					items-start
					justify-between
					gap-4
				"
			>
				<div>
					<h2
						className="
							text-[24px]
							font-semibold
							tracking-tight
							text-white
						"
					>
						Most Popular Books
					</h2>

					<p
						className="
							mt-1.5
							text-sm
							leading-relaxed
							text-gray-400
						"
					>
						Books with the highest community activity and discussions.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<PopularRangeDropdown value={range} onChange={setRange} />

					<div
						className="
							flex
							items-center
							gap-1
						"
					>
						<button
							onClick={() => scroll("left")}
							disabled={!canScrollLeft}
							className="
								flex
								h-8
								w-8
								items-center
								justify-center

								rounded-xl

								border
								border-white/10

								bg-white/[0.03]

								text-gray-300

								transition-all
								duration-200

								hover:border-blue-500/30
								hover:bg-blue-500/10
								hover:text-white

								disabled:opacity-30
								disabled:cursor-not-allowed
								disabled:hover:bg-white/[0.03]
								disabled:hover:border-white/10
								disabled:hover:text-gray-300
							"
						>
							<ChevronLeft size={14} />
						</button>

						<button
							onClick={() => scroll("right")}
							disabled={!canScrollRight}
							className="
								flex
								h-8
								w-8
								items-center
								justify-center

								rounded-xl

								border
								border-white/10

								bg-white/[0.03]

								text-gray-300

								transition-all
								duration-200

								hover:border-blue-500/30
								hover:bg-blue-500/10
								hover:text-white

								disabled:opacity-30
								disabled:cursor-not-allowed
								disabled:hover:bg-white/[0.03]
								disabled:hover:border-white/10
								disabled:hover:text-gray-300
							"
						>
							<ChevronRight size={14} />
						</button>
					</div>
				</div>
			</div>

			{/* CONTENT */}
			<div className="mt-3">
				{isLoading ? (
					<div
						className="
							flex
							h-[260px]
							items-center
							justify-center
							text-sm
							text-gray-500
						"
					>
						Loading popular books...
					</div>
				) : (
					<div
						ref={scrollRef}
						className="
							flex
							gap-2
							overflow-x-hidden
							scroll-smooth
						"
					>
						{books.map((book) => (
							<PopularBookCard key={book.public_id} book={book} />
						))}
					</div>
				)}
			</div>
		</section>
	);
}
