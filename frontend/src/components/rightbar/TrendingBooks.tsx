"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Book = {
	id: number;
	title: string;
	genre: string;
	rating: number;
	cover: string;
};

export function TrendingBooks() {
	const [books, setBooks] = useState<Book[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("http://localhost:8080/api/books/trending")
			.then((res) => res.json())
			.then((data) => setBooks(data))
			.catch((err) => console.error(err))
			.finally(() => setLoading(false));
	}, []);

	return (
		<div className="bg-white/5 p-4 rounded-xl">
			<h2 className="font-semibold mb-3">Trending Books</h2>

			{loading && <p className="text-sm text-gray-400">Loading...</p>}

			{books.map((b) => (
				<div key={b.id} className="flex gap-3 mb-3">
					<Image
						src={b.cover}
						alt={b.title}
						width={48} // 12 * 4 (Tailwind w-12)
						height={64} // 16 * 4 (Tailwind h-16)
						className="rounded-md object-cover"
						unoptimized
					/>

					<div className="flex-1">
						<p className="font-medium text-sm">{b.title}</p>
						<p className="text-xs text-gray-400">{b.genre}</p>

						<div className="text-yellow-400 text-sm">
							⭐ {b.rating}
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
