import Image from "next/image";
import { BookOpen } from "lucide-react";

import { PopularBookItem } from "@/types/book";

import BookRatingBadge from "./BookRatingBadge";

type Props = {
	book: PopularBookItem;
};

export default function PopularBookCard({ book }: Props) {
	return (
		<div
			className="
				group
				w-[180px]
				shrink-0
			"
		>
			{/* COVER */}
			<div
				className="
					relative
					aspect-[3/4]
					overflow-hidden
					rounded-3xl
					border
					border-white/10
					bg-white/[0.03]
				"
			>
				<Image
					src={book.cover_img_url}
					alt={book.title}
					fill
					className="
						object-cover
						transition-transform
						duration-500
						group-hover:scale-105
					"
				/>

				{/* GRADIENT */}
				<div
					className="
						absolute inset-0
						bg-gradient-to-t
						from-black/70
						via-transparent
						to-transparent
					"
				/>
			</div>

			{/* CONTENT */}
			<div className="mt-3 space-y-3">
				<h2
					className="
						line-clamp-2
						text-sm
						font-semibold
						leading-relaxed
						text-white
					"
				>
					{book.title}
				</h2>

				<div
					className="
						flex
						items-center
						justify-between
						gap-2
					"
				>
					<BookRatingBadge rating={book.rating} />

					<div
						className="
							flex
							items-center
							gap-1
							text-xs
							text-gray-400
						"
					>
						<BookOpen size={14} />

						<span>{book.total_pages}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
