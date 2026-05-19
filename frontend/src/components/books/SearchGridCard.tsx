import Image from "next/image";
import { BookSearchItem } from "@/types/book";
import BookRatingBadge from "./BookRatingBadge";
import { BookOpen } from "lucide-react";

type Props = {
	book: BookSearchItem;
};

export default function SearchGridCard({ book }: Props) {
	return (
		<div
			className="
				group
				overflow-hidden
				rounded-3xl
				border
				border-white/10
				bg-white/[0.03]
				transition-all
				duration-300
				hover:-translate-y-1
				hover:border-blue-500/30
				hover:bg-white/[0.05]
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
			</div>

			{/* CONTENT */}
			<div className="space-y-3 p-4">
				{/* TITLE */}
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

				{/* FOOTER */}
				<div
					className="
			flex
			items-center
			justify-between
			gap-3
		"
				>
					<BookRatingBadge rating={book.rating} />

					<div
						className="
				flex
				items-center
				gap-1.5
				text-xs
				text-gray-400
			"
					>
						<BookOpen size={14} />

						<span>{book.total_pages} pages</span>
					</div>
				</div>
			</div>
		</div>
	);
}
