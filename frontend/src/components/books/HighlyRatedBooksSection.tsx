"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getHighlyRatedBooksAPI } from "@/lib/api";

import { HighlyRatedBookItem } from "@/types/book";

import PopularBookCard from "./PopularBookCard";

export default function HighlyRatedBooksSection() {
	const [books, setBooks] = useState<HighlyRatedBookItem[]>([]);

	const [isLoading, setIsLoading] = useState(false);

	const scrollRef = useRef<HTMLDivElement | null>(null);

	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(true);

	// CHECK SCROLL
	const checkScroll = () => {
		if (!scrollRef.current) return;

		const el = scrollRef.current;

		setCanScrollLeft(el.scrollLeft > 0);

		setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
	};

	// LISTENER
	useEffect(() => {
		const el = scrollRef.current;

		if (!el) return;

		checkScroll();

		el.addEventListener("scroll", checkScroll);

		return () => {
			el.removeEventListener("scroll", checkScroll);
		};
	}, [books]);

	// FETCH
	useEffect(() => {
		const fetchBooks = async () => {
			try {
				setIsLoading(true);

				const data = await getHighlyRatedBooksAPI();

				setBooks(data.books || []);
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchBooks();
	}, []);

	// SCROLL
	const scroll = (direction: "left" | "right") => {
		if (!scrollRef.current) return;

		const container = scrollRef.current;

		const scrollAmount = container.clientWidth * 0.75;

		container.scrollBy({
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
						Highly Rated Books
					</h2>

					<p
						className="
							mt-1.5
							text-sm
							leading-relaxed
							text-gray-400
						"
					>
						Books with the strongest community ratings and reviews.
					</p>
				</div>

				{/* ARROWS */}
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

							disabled:cursor-not-allowed
							disabled:opacity-30

							disabled:hover:border-white/10
							disabled:hover:bg-white/[0.03]
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

							disabled:cursor-not-allowed
							disabled:opacity-30

							disabled:hover:border-white/10
							disabled:hover:bg-white/[0.03]
							disabled:hover:text-gray-300
						"
					>
						<ChevronRight size={14} />
					</button>
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
						Loading highly rated books...
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
							<PopularBookCard
								key={book.public_id}
								book={{
									public_id: book.public_id,
									title: book.title,
									cover_img_url: book.cover_img_url,
									rating: book.rating,
									total_pages: book.total_pages,
									authors: book.authors,
									publication_year: book.publication_year,
								}}
							/>
						))}
					</div>
				)}
			</div>
		</section>
	);
}
