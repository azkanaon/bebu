type Props = {
	rating: number;
};

export default function BookRatingBadge({ rating }: Props) {
	const getRatingStyle = (rating: number) => {
		if (rating >= 4.5) {
			return {
				bg: "bg-cyan-500/10",
				border: "border-cyan-400/20",
				text: "text-cyan-300",
				glow: "shadow-[0_0_18px_rgba(34,211,238,0.12)]",
			};
		}

		if (rating >= 4.0) {
			return {
				bg: "bg-emerald-500/10",
				border: "border-emerald-400/20",
				text: "text-emerald-300",
				glow: "shadow-[0_0_18px_rgba(74,222,128,0.10)]",
			};
		}

		if (rating >= 3.0) {
			return {
				bg: "bg-yellow-500/10",
				border: "border-yellow-400/20",
				text: "text-yellow-300",
				glow: "shadow-[0_0_18px_rgba(250,204,21,0.10)]",
			};
		}

		if (rating >= 2.0) {
			return {
				bg: "bg-orange-500/10",
				border: "border-orange-400/20",
				text: "text-orange-300",
				glow: "shadow-[0_0_18px_rgba(251,146,60,0.10)]",
			};
		}

		return {
			bg: "bg-red-500/10",
			border: "border-red-400/20",
			text: "text-red-300",
			glow: "shadow-[0_0_18px_rgba(248,113,113,0.10)]",
		};
	};

	const ratingStyle = getRatingStyle(rating);

	return (
		<div
			className={`
				flex items-center gap-1
				px-2.5 py-1
				rounded-full
				backdrop-blur-sm
				border
				text-xs font-semibold
				tabular-nums
				transition-all duration-300
				ring-1 ring-white/[0.03]
				${ratingStyle.bg}
				${ratingStyle.border}
				${ratingStyle.text}
				${ratingStyle.glow}
			`}
		>
			<span className="text-[10px] opacity-80">★</span>

			<span>{rating.toFixed(1)}</span>
		</div>
	);
}
