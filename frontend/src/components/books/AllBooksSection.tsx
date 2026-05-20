"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAllBooksAPI } from "@/lib/api";
import { BookSearchItem } from "@/types/book";
import SearchGridCard from "./SearchGridCard";
import BookSortDropdown from "./BookSortDropdown";
import SearchPagination from "./SearchPagination";

type SortType = "title" | "newest" | "rating" | "popular";

export default function AllBooksSection() {
	const [books, setBooks] = useState<BookSearchItem[]>([]);

	const [page, setPage] = useState(1);

	const [totalPages, setTotalPages] = useState(1);

	const [sort, setSort] = useState<SortType>("title");

	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		const fetchBooks = async () => {
			try {
				setIsLoading(true);

				const data = await getAllBooksAPI({
					page,
					limit: 15,
					sort,
				});

				setBooks(data.books || []);

				setTotalPages(data.total_pages || 1);
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchBooks();
	}, [page, sort]);

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
						All Books
					</h2>

					<p
						className="
							mt-1.5
							text-sm
							leading-relaxed
							text-gray-400
						"
					>
						Explore the complete collection of books from the community
						library.
					</p>
				</div>

				{/* ACTIONS */}
				<div
					className="
			flex
			items-center
			gap-2
		"
				>
					{/* SORT */}
					<BookSortDropdown
						value={sort}
						onChange={(value) => {
							setPage(1);

							setSort(value);
						}}
					/>

					{/* PAGINATION MINI */}
					<div
						className="
				flex
				items-center
				gap-1
			"
					>
						<button
							onClick={() =>
								setPage((prev) => Math.max(prev - 1, 1))
							}
							disabled={page === 1}
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
							onClick={() =>
								setPage((prev) =>
									Math.min(prev + 1, totalPages),
								)
							}
							disabled={page === totalPages}
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
			</div>

			{/* CONTENT */}
			<div className="mt-5">
				{isLoading ? (
					<div
						className="
							flex
							h-[420px]
							items-center
							justify-center

							text-sm
							text-gray-500
						"
					>
						Loading books...
					</div>
				) : (
					<div
						className="
							grid
							grid-cols-2
							gap-3

							md:grid-cols-3
						"
					>
						{books.map((book) => (
							<SearchGridCard key={book.public_id} book={book} />
						))}
					</div>
				)}
			</div>

			{/* PAGINATION */}
			<div className="mt-4">
				<SearchPagination
					page={page}
					totalPages={totalPages}
					onNext={() =>
						setPage((prev) => Math.min(prev + 1, totalPages))
					}
					onPrev={() => setPage((prev) => Math.max(prev - 1, 1))}
					onPageChange={(newPage) => setPage(newPage)}
				/>
			</div>
		</section>
	);
}
