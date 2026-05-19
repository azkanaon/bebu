"use client";

import { useEffect, useState } from "react";

import { getAllBooksAPI } from "@/lib/api";

import { BookSearchItem } from "@/types/book";

import SearchGridCard from "./SearchGridCard";

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
					limit: 20,
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
		<div className="space-y-6">
			{/* HEADER */}
			<div
				className="
					flex
					items-center
					justify-between
					gap-4
				"
			>
				<div>
					<h2
						className="
							text-2xl
							font-bold
							text-white
						"
					>
						All Books
					</h2>

					<p
						className="
							mt-1
							text-sm
							text-gray-400
						"
					>
						Browse all available books
					</p>
				</div>

				{/* SORT */}
				<select
					value={sort}
					onChange={(e) => {
						setPage(1);

						setSort(e.target.value as SortType);
					}}
					className="
						rounded-xl
						border
						border-white/10
						bg-[#0B1020]
						px-4
						py-2
						text-sm
						text-gray-300
						outline-none
					"
				>
					<option value="title">Alphabetical</option>

					<option value="newest">Newest</option>

					<option value="rating">Highest Rated</option>

					<option value="popular">Most Popular</option>
				</select>
			</div>

			{/* CONTENT */}
			{isLoading ? (
				<div className="text-gray-400">Loading...</div>
			) : (
				<div
					className="
						grid
						grid-cols-2
						gap-5

						sm:grid-cols-3
						lg:grid-cols-4
					"
				>
					{books.map((book) => (
						<SearchGridCard key={book.public_id} book={book} />
					))}
				</div>
			)}

			{/* PAGINATION */}
			<div
				className="
					flex
					items-center
					justify-center
					gap-3
					pt-4
				"
			>
				<button
					onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
					disabled={page === 1}
					className="
						rounded-xl
						border
						border-white/10
						bg-white/[0.03]
						px-4
						py-2
						text-sm
						text-white
						disabled:opacity-40
					"
				>
					Prev
				</button>

				<div
					className="
						text-sm
						text-gray-400
					"
				>
					Page {page} of {totalPages}
				</div>

				<button
					onClick={() =>
						setPage((prev) => Math.min(prev + 1, totalPages))
					}
					disabled={page === totalPages}
					className="
						rounded-xl
						border
						border-white/10
						bg-white/[0.03]
						px-4
						py-2
						text-sm
						text-white
						disabled:opacity-40
					"
				>
					Next
				</button>
			</div>
		</div>
	);
}