import Link from "next/link";
import { BookOpen, Clock3 } from "lucide-react";
import { BookSearchItem } from "@/types/book";
import BookRatingBadge from "./BookRatingBadge";
import BookCover from "@/components/BookCover";

type Props = {
	book: BookSearchItem;
};

export default function SearchGridCard({ book }: Props) {
	return (
		<Link
			href={`/books/${book.slug}`} // Mengarah ke ./books/[slug]
			className="
        group
        block
        cursor-pointer

        border
        border-blue-400/[0.08]

        bg-[#0B1220]/60

        transition-all
        duration-300

        hover:border-blue-400/[0.16]
        hover:bg-[#0B1220]/78
    "
		>
			{/* COVER */}
			<div
				className="
					relative

					aspect-[3/4]
					w-full

					overflow-hidden
				"
			>\
				<BookCover
					src={book.cover_img_url}
					title={book.title}
					fill
					className="transition-transform duration-700 group-hover:scale-[1.02]"
				/>

				{/* RATING */}
				<div className="absolute top-3 right-3 z-10">
					<BookRatingBadge rating={book.rating} />
				</div>
			</div>

			{/* CONTENT */}
			<div className="space-y-1.5 px-4 py-3">
				{/* TITLE */}
				<h2
					className="
						line-clamp-1

						text-sm
						font-semibold
						leading-6
						tracking-tight

						text-white

						transition-colors
						duration-300

						group-hover:text-blue-50
					"
				>
					{book.title}
				</h2>

				{/* AUTHOR */}
				<p
					className="
						line-clamp-1

						text-xs
						font-medium

						text-gray-400
					"
				>
					{book.authors[0]}
				</p>

				{/* FOOTER */}
				<div
					className="
						flex
						items-center
						justify-between

						text-[11px]
						text-gray-500
					"
				>
					<div className="flex items-center gap-1.5">
						<BookOpen size={13} />

						<span>{book.total_pages} pages</span>
					</div>

					<div className="flex items-center gap-1.5">
						<Clock3 size={13} />

						<span>{book.publication_year} </span>
					</div>
				</div>
			</div>
		</Link>
	);
}
