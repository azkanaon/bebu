type Props = {
	page: number;
	totalPages: number;
	onNext: () => void;
	onPrev: () => void;
};

export default function SearchPagination({
	page,
	totalPages,
	onNext,
	onPrev,
}: Props) {
	if (totalPages <= 1) return null;

	return (
		<div
			className="
				mt-10
				flex
				items-center
				justify-center
				gap-4
			"
		>
			<button
				onClick={onPrev}
				disabled={page === 1}
				className="
					rounded-xl
					border
					border-white/10
					bg-white/[0.03]
					px-4
					py-2
					text-sm
					text-white
					transition-all
					hover:bg-white/[0.06]
					disabled:cursor-not-allowed
					disabled:opacity-40
				"
			>
				Previous
			</button>

			<div className="text-sm text-gray-400">
				Page {page} of {totalPages}
			</div>

			<button
				onClick={onNext}
				disabled={page >= totalPages}
				className="
					rounded-xl
					border
					border-white/10
					bg-white/[0.03]
					px-4
					py-2
					text-sm
					text-white
					transition-all
					hover:bg-white/[0.06]
					disabled:cursor-not-allowed
					disabled:opacity-40
				"
			>
				Next
			</button>
		</div>
	);
}
