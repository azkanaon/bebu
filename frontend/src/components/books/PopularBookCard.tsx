import Image from "next/image";
import Link from "next/link";

import { BookOpen, Clock3, MessageSquareText } from "lucide-react";
import { PopularBookItem } from "@/types/book";
import BookRatingBadge from "./BookRatingBadge";
import BookCover from "@/components/BookCover";

type Props = {
	book: PopularBookItem;
};

export default function PopularBookCard({ book }: Props) {
	return (
		<Link
			href={`/books/${book.slug}`} // Mengarah ke ./books/[slug] (sesuaikan dengan properti slug buku kamu)
			className="
        group
        w-[190px]
        shrink-0
        block       {/* Ditambahkan agar perilaku layouting Link sama seperti div asli */}
        cursor-pointer
    "
		>
			<div
				className="
					overflow-hidden

					border
					border-blue-400/[0.08]

					bg-[#0B1220]/70

					transition-all
					duration-300

					hover:border-blue-400/[0.16]
					hover:bg-[#0B1220]/85
				"
			>
				{/* COVER */}
				<div
					className="
						relative

						aspect-[3/4]
						overflow-hidden
					"
				>
					<BookCover
						src={book.cover_img_url}
						title={book.title}
						fill
						className="transition-transform duration-700 group-hover:scale-[1.02]"
					/>

					{/* OVERLAY */}
					<div
						className="
							absolute
							inset-0

							bg-gradient-to-t
							from-black/55
							via-black/10
							to-transparent
						"
					/>

					{/* RATING */}
					<div className="absolute top-3 right-3 z-10">
						<BookRatingBadge rating={book.rating} />
					</div>

					{/* POSTS */}
					{book.popularity_score !== undefined && (
						<div
							className="
								absolute
								left-3
								bottom-3
								z-10

								flex
								items-center
								gap-1.5

								border
								border-white/10

								bg-black/35

								px-2
								py-1

								backdrop-blur-md

								text-[11px]
								font-medium
								text-white
							"
						>
							<MessageSquareText size={12} />

							<span>{book.popularity_score}</span>
						</div>
					)}
				</div>

				{/* CONTENT */}
				<div className="space-y-1.5 px-3.5 py-3">
					{/* TITLE */}
					<h2
						className="
							line-clamp-1

							text-[14px]
							font-semibold
							leading-5
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

							text-[12px]
							font-medium

							text-gray-400
						"
					>
						{book.authors?.[0]}
					</p>

					{/* FOOTER */}
					<div
						className="
							mt-2

							flex
							items-center
							justify-between

							text-[11px]
							text-gray-500
						"
					>
						<div className="flex items-center gap-1">
							<BookOpen size={12} />

							<span>{book.total_pages}</span>
						</div>

						<div className="flex items-center gap-1">
							<Clock3 size={12} />

							<span>{book.publication_year}</span>
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
}
