import Image from "next/image";
import { Clock3, Globe2, FileText } from "lucide-react";

import { BookSearchItem } from "@/types/book";
import BookRatingBadge from "./BookRatingBadge";

type Props = {
	book: BookSearchItem;
};

export default function SearchResultCard({ book }: Props) {
	return (
		<div
			className="
				group
				relative

				overflow-hidden

				border
				border-blue-400/[0.06]

				bg-[#0B1220]/55

				px-4 py-3.5

				backdrop-blur-xl

				transition-all
				duration-300

				hover:border-blue-400/[0.14]
				hover:bg-[#0B1220]/78
				hover:shadow-[0_0_40px_rgba(59,130,246,0.06)]
			"
		>
			{/* HOVER GLOW */}
			<div
				className="
					pointer-events-none
					absolute
					inset-0

					opacity-0

					bg-gradient-to-br
					from-blue-500/[0.03]
					via-transparent
					to-cyan-400/[0.02]

					transition-opacity
					duration-500

					group-hover:opacity-100
				"
			/>

			<div className="relative flex gap-4">
				{/* COVER */}
				<div
					className="
						relative

						h-[152px]
						w-[102px]

						shrink-0
						overflow-hidden

						bg-white/[0.03]

						ring-1
						ring-white/[0.06]

						shadow-[0_10px_30px_rgba(0,0,0,0.35)]

						transition-transform
						duration-500

						group-hover:scale-[1.02]
					"
				>
					<Image
						src={book.cover_img_url}
						alt={book.title}
						fill
						className="
							object-cover
						"
					/>

					{/* IMAGE OVERLAY */}
					<div
						className="
							absolute
							inset-0

							bg-gradient-to-t
							from-black/20
							via-transparent
							to-white/[0.02]
						"
					/>
				</div>

				{/* CONTENT */}
				<div className="min-w-0 flex-1">
					{/* TOP */}
					<div className="flex items-start justify-between gap-4">
						<div className="min-w-0">
							<h2
								className="
									line-clamp-2

									text-[1.05rem]
									font-semibold
									leading-snug
									tracking-tight

									text-white

									transition-colors
									duration-300

									group-hover:text-blue-50
								"
							>
								{book.title}
							</h2>

							{/* AUTHORS */}
							<p
								className="
									mt-1

									text-sm
									font-medium

									text-gray-300
								"
							>
								{book.authors.join(", ")}
							</p>
						</div>

						<BookRatingBadge rating={book.rating} />
					</div>

					{/* META */}
					<div
						className="
							mt-2

							flex
							flex-wrap
							items-center
							gap-x-4
							gap-y-2

							text-xs
							text-gray-400
						"
					>
						<div className="flex items-center gap-1.5">
							<Clock3 size={13} />

							<span>{book.publication_year}</span>
						</div>

						<div className="flex items-center gap-1.5">
							<Globe2 size={13} />

							<span>{book.language}</span>
						</div>

						<div className="flex items-center gap-1.5">
							<FileText size={13} />

							<span>{book.total_pages} pages</span>
						</div>
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
						{book.genres.slice(0, 4).map((genre) => (
							<div
								key={genre}
								className="
									px-2.5
									py-0.5

									rounded-full

									border
									border-blue-500/20

									bg-blue-500/10

									text-[11px]
									font-medium
									tracking-wide

									text-blue-300

									backdrop-blur-sm

									transition-colors
									duration-200

									hover:bg-blue-500/20
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

							line-clamp-3

							text-sm
							leading-6

							text-gray-300/90
						"
					>
						{book.synopsis}
					</p>
				</div>
			</div>
		</div>
	);
}
