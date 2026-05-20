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
			<div
				className="
					flex
					flex-col
					items-center
					justify-center

					rounded-3xl

					border
					border-blue-400/[0.08]

					bg-[#0B1220]/50

					py-20

					backdrop-blur-xl
				"
			>
				<div
					className="
						h-10
						w-10
						rounded-full

						border-2
						border-blue-400/20
						border-t-blue-300

						animate-spin
					"
				/>

				<p
					className="
						mt-5
						text-sm
						text-gray-400
					"
				>
					Searching books...
				</p>
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
					border-blue-400/[0.08]

					bg-[#0B1220]/50

					px-6
					py-24

					text-center

					backdrop-blur-xl
				"
			>
				<div
					className="
						flex
						h-16
						w-16
						items-center
						justify-center

						rounded-2xl

						bg-blue-500/[0.08]

						text-2xl
					"
				>
					📚
				</div>

				<h2
					className="
						mt-6
						text-xl
						font-semibold
						tracking-tight
						text-white
					"
				>
					No books found
				</h2>

				<p
					className="
						mt-2
						max-w-sm
						text-sm
						leading-relaxed
						text-gray-400
					"
				>
					Try changing your keywords, filters, or search another
					title.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* CONTENT */}
			<div
				className={
					viewMode === "grid"
						? `
							grid
							grid-cols-2
							gap-x-2
							gap-y-2

							sm:grid-cols-3
							xl:grid-cols-3
						`
						: `
							grid
							grid-cols-1
							gap-3
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
