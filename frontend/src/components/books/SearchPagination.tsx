import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
	page: number;
	totalPages: number;
	onNext: () => void;
	onPrev: () => void;
	onPageChange: (page: number) => void;
};

export default function SearchPagination({
	page,
	totalPages,
	onNext,
	onPrev,
	onPageChange,
}: Props) {
	if (totalPages <= 1) return null;

	const generatePages = () => {
		const pages: (number | string)[] = [];

		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}

			return pages;
		}

		pages.push(1);

		if (page > 3) {
			pages.push("...");
		}

		for (
			let i = Math.max(2, page - 1);
			i <= Math.min(totalPages - 1, page + 1);
			i++
		) {
			pages.push(i);
		}

		if (page < totalPages - 2) {
			pages.push("...");
		}

		pages.push(totalPages);

		return pages;
	};

	return (
		<div
			className="
				flex
				items-center
				justify-center
				gap-1.5
				flex-wrap
			"
		>
			{/* PREV */}
			<button
				onClick={onPrev}
				disabled={page === 1}
				className="
					group

					flex
					items-center
					gap-2

					rounded-full

					border
					border-blue-400/[0.08]

					bg-[#0F172A]/70
					backdrop-blur-xl

					px-3
					py-1.5

					text-[13px]
					font-medium
					text-gray-300

					transition-all
					duration-300

					hover:border-blue-400/20
					hover:bg-blue-500/[0.06]
					hover:text-white

					disabled:pointer-events-none
					disabled:opacity-35
				"
			>
				<ChevronLeft
					size={14}
					className="
						transition-transform
						duration-300

						group-hover:-translate-x-0.5
					"
				/>

				<span>Prev</span>
			</button>

			{/* PAGE NUMBERS */}
			<div className="flex items-center gap-2">
				{generatePages().map((item, index) => {
					if (item === "...") {
						return (
							<div
								key={`ellipsis-${index}`}
								className="
									px-1
									text-sm
									text-gray-500
								"
							>
								...
							</div>
						);
					}

					const pageNumber = item as number;
					const isActive = pageNumber === page;

					return (
						<button
							key={`page-${pageNumber}`}
							onClick={() => onPageChange(pageNumber)}
							className={clsx(
								`
									h-8
									min-w-8

									rounded-full

									border

									text-[13px]
									font-medium

									transition-all
									duration-300
								`,
								isActive
									? `
										border-blue-400/30
										bg-blue-500/15
										text-blue-200

										shadow-[0_0_25px_rgba(59,130,246,0.16)]
									`
									: `
										border-blue-400/[0.08]

										bg-[#0F172A]/70
										backdrop-blur-xl

										text-gray-400

										hover:border-blue-400/20
										hover:bg-blue-500/[0.06]
										hover:text-white
									`,
							)}
						>
							{pageNumber}
						</button>
					);
				})}
			</div>

			{/* NEXT */}
			<button
				onClick={onNext}
				disabled={page >= totalPages}
				className="
					group

					flex
					items-center
					gap-2

					rounded-full

					border
					border-blue-400/[0.08]

					bg-[#0F172A]/70
					backdrop-blur-xl

					px-3
					py-1.5

					text-[13px]
					font-medium
					text-gray-300

					transition-all
					duration-300

					hover:border-blue-400/20
					hover:bg-blue-500/[0.06]
					hover:text-white

					disabled:pointer-events-none
					disabled:opacity-35
				"
			>
				<span>Next</span>

				<ChevronRight
					size={14}
					className="
						transition-transform
						duration-300

						group-hover:translate-x-0.5
					"
				/>
			</button>
		</div>
	);
}
