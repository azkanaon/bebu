import { BookSearchItem } from "@/types/book";

import SearchResultCard from "./SearchResultCard";
import SearchGridCard from "./SearchGridCard";

type Props = {
	books: BookSearchItem[];
	isSearching: boolean;
	viewMode: "list" | "grid";
};

export default function SearchResults({ books, isSearching, viewMode }: Props) {
	// LOADING
	if (isSearching) {
		return (
			<div className="py-10 text-center text-gray-400">
				Searching books...
			</div>
		);
	}

	// EMPTY
	if (books.length === 0) {
		return (
			<div
				className="
					flex
					flex-col
					items-center
					justify-center
					rounded-3xl
					border
					border-white/10
					bg-white/[0.02]
					py-20
					text-center
				"
			>
				<h2 className="text-xl font-semibold text-white">
					No books found
				</h2>

				<p className="mt-2 text-sm text-gray-400">
					Try changing keywords or filters
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8">

			{/* GRID */}
			<div
				className={
					viewMode === "grid"
						? `
				grid
				grid-cols-2
				gap-5
				sm:grid-cols-3
				xl:grid-cols-4
			`
						: `
				grid
				grid-cols-1
				gap-4
			`
				}
			>
				{books.map((book) =>
					viewMode === "grid" ? (
						<SearchGridCard key={book.public_id} book={book} />
					) : (
						<SearchResultCard key={book.public_id} book={book} />
					),
				)}
			</div>
		</div>
	);
}
