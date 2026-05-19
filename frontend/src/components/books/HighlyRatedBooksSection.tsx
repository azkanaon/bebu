"use client";

import { useEffect, useState } from "react";

import { getHighlyRatedBooksAPI } from "@/lib/api";

import { HighlyRatedBookItem } from "@/types/book";

import PopularBookCard from "./PopularBookCard";

export default function HighlyRatedBooksSection() {
	const [books, setBooks] = useState<HighlyRatedBookItem[]>([]);

	const [isLoading, setIsLoading] = useState(false);

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

	return (
		<div className="space-y-6">
			{/* HEADER */}
			<div>
				<h2
					className="
						text-2xl
						font-bold
						text-white
					"
				>
					Highly Rated Books
				</h2>

				<p
					className="
						mt-1
						text-sm
						text-gray-400
					"
				>
					Books with the highest community ratings
				</p>
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
						<PopularBookCard
							key={book.public_id}
							book={{
								public_id: book.public_id,

								title: book.title,

								cover_img_url: book.cover_img_url,

								rating: book.rating,

								total_pages: book.total_pages,

								authors: book.authors,

								popularity_score: 0,
							}}
						/>
					))}
				</div>
			)}
		</div>
	);
}
