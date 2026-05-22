"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RecommendationBookItem } from "@/types/book";
import PopularBookCard from "../books/PopularBookCard";
import Link from "next/link";

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

		container.scrollBy({
			left:
				direction === "right"
					? container.clientWidth * 0.8
					: -container.clientWidth * 0.8,
			behavior: "smooth",
		});
	};

	if (!books || books.length === 0) return null;

	return (
		<section
			className="
		rounded-2xl
		border border-white/[0.06]
		bg-gradient-to-br
		from-white/[0.03]
		to-white/[0.015]
		p-5
		backdrop-blur-xl
	"
		>
			{/* HEADER */}
			<div className="mb-4 flex items-end justify-between gap-4">
				<div>
					<h2 className="text-[22px] font-semibold tracking-tight text-white/95">
						{title}
					</h2>

					<p className="text-[13px] leading-relaxed text-slate-400">
						{description}
					</p>
				</div>

				{/* NAVIGATION */}
				<div className="flex items-center gap-2">
					<button
						onClick={() => scroll("left")}
						disabled={!canScrollLeft}
						className="
							group
							flex
							h-9
							w-9
							items-center
							justify-center
							rounded-full
							border
							border-white/10
							bg-white/[0.03]
							text-slate-300
							backdrop-blur-xl
							transition-all
							duration-300
							hover:-translate-y-0.5
							hover:border-indigo-400/30
							hover:bg-indigo-500/10
							hover:text-white
							disabled:cursor-not-allowed
							disabled:opacity-30
						"
					>
						<ChevronLeft
							size={15}
							className="transition-transform duration-300 group-hover:-translate-x-0.5"
						/>
					</button>

					<button
						onClick={() => scroll("right")}
						disabled={!canScrollRight}
						className="
							group
							flex
							h-9
							w-9
							items-center
							justify-center
							rounded-full
							border
							border-white/10
							bg-white/[0.03]
							text-slate-300
							backdrop-blur-xl
							transition-all
							duration-300
							hover:-translate-y-0.5
							hover:border-indigo-400/30
							hover:bg-indigo-500/10
							hover:text-white
							disabled:cursor-not-allowed
							disabled:opacity-30
						"
					>
						<ChevronRight
							size={15}
							className="transition-transform duration-300 group-hover:translate-x-0.5"
						/>
					</button>
				</div>
			</div>

			{/* CAROUSEL */}
			<div className="relative">
				<div
					ref={scrollRef}
					className="
						flex
						gap-4
						overflow-x-auto
						scroll-smooth
						[scrollbar-width:none]
						[-ms-overflow-style:none]
						[&::-webkit-scrollbar]:hidden
					"
				>
					{books.map((book) => (
						<Link
							key={book.public_id}
							href={`/books/${book.slug}`}
							className="
								group
								shrink-0
								transition-all
								duration-300
								hover:-translate-y-1
							"
						>
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
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}
