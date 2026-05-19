import Image from "next/image";
import { BookSearchItem } from "@/types/book";
import BookRatingBadge from "./BookRatingBadge";

type Props = {
	book: BookSearchItem;
};

export default function SearchResultCard({ book }: Props) {
	return (
		<div
			className="
                flex
                gap-4
                p-4
                rounded-2xl
                border
                border-white/5
                bg-white/[0.02]
                hover:bg-white/[0.04]
                transition-all
                duration-300
            "
		>
			{/* COVER */}
			<div
				className="
					relative
					w-[95px]
					h-[140px]
					shrink-0
					overflow-hidden
					rounded-xl
					bg-white/5
					border
					border-white/10
				"
			>
				<Image
					src={book.cover_img_url}
					alt={book.title}
					fill
					className="object-cover"
				/>
			</div>

			{/* CONTENT */}
			<div className="min-w-0 flex-1">
				<div className="flex items-start justify-between gap-3">
					<h2
						className="
			line-clamp-1
			text-lg
			font-semibold
			text-white
		"
					>
						{book.title}
					</h2>

					<BookRatingBadge rating={book.rating} />
				</div>

				{/* META */}
				<div
					className="
						mt-1
						flex
						flex-wrap
						items-center
						gap-x-2
						gap-y-1
						text-xs
						text-gray-400
					"
				>
					<span>{book.authors.join(", ")}</span>

					<span>•</span>

					<span>{book.publication_year}</span>

					<span>•</span>

					<span>{book.language}</span>

					<span>•</span>

					<span>{book.total_pages} pages</span>
				</div>

				{/* GENRES */}
				<div
					className="
						mt-3
						flex
						flex-wrap
						gap-2
					"
				>
					{book.genres.map((genre) => (
						<div
							key={genre}
							className="
								rounded-full
								bg-blue-500/10
								px-2.5
								py-1
								text-xs
								text-blue-300
								border
								border-blue-500/20
							"
						>
							{genre}
						</div>
					))}
				</div>

				{/* SYNOPSIS */}
				<p
					className="
						mt-3
						line-clamp-4
						text-sm
						leading-relaxed
						text-gray-300
					"
				>
					{book.synopsis}
				</p>
			</div>
		</div>
	);
}
