"use client";

import { useEffect, useState } from "react";

import { getPopularBooksAPI } from "@/lib/api";

import { PopularBookItem } from "@/types/book";

import PopularBookCard from "./PopularBookCard";
import PopularRangeDropdown from "./PopularRangeDropdown";

type RangeType = "today" | "7d" | "30d" | "all";

export default function PopularBooksSection() {
	const [range, setRange] = useState<RangeType>("today");

	const [books, setBooks] = useState<PopularBookItem[]>([]);

	const [isLoading, setIsLoading] = useState(false);

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
						Most Popular Books
					</h2>

					<p
						className="
							mt-1
							text-sm
							text-gray-400
						"
					>
						Trending books based on discussions and reviews
					</p>
				</div>

				<PopularRangeDropdown value={range} onChange={setRange} />
			</div>

			{/* CONTENT */}
			{isLoading ? (
				<div className="text-gray-400">Loading...</div>
			) : (
				<div
					className="
						flex
						gap-5
						overflow-x-auto
						pb-2
						scrollbar-hide
					"
				>
					{books.map((book) => (
						<PopularBookCard key={book.public_id} book={book} />
					))}
				</div>
			)}
		</div>
	);
}
