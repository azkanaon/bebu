type Props = {
	rating: number;
};

export default function BookRatingBadge({ rating }: Props) {
	const getRatingStyle = (rating: number) => {
		if (rating >= 4.5) {
			return {
				text: "text-cyan-300",
				star: "text-cyan-300",
				border: "border-cyan-400/20",
				shadow: "shadow-[0_4px_18px_rgba(34,211,238,0.14)]",
			};
		}

		if (rating >= 4.0) {
			return {
				text: "text-emerald-300",
				star: "text-emerald-300",
				border: "border-emerald-400/20",
				shadow: "shadow-[0_4px_18px_rgba(74,222,128,0.12)]",
			};
		}

		if (rating >= 3.0) {
			return {
				text: "text-yellow-300",
				star: "text-yellow-300",
				border: "border-yellow-400/20",
				shadow: "shadow-[0_4px_18px_rgba(250,204,21,0.12)]",
			};
		}

		if (rating >= 2.0) {
			return {
				text: "text-orange-300",
				star: "text-orange-300",
				border: "border-orange-400/20",
				shadow: "shadow-[0_4px_18px_rgba(251,146,60,0.12)]",
			};
		}

		return {
			text: "text-red-300",
			star: "text-red-300",
			border: "border-red-400/20",
			shadow: "shadow-[0_4px_18px_rgba(248,113,113,0.12)]",
		};
	};

	const style = getRatingStyle(rating);

	return (
		<div
			className={`
				flex
				items-center
				gap-1.5

				rounded-full

				bg-[#0F172A]/72
				backdrop-blur-md

				px-2.5
				py-1

				border
				${style.border}

				${style.shadow}
			`}
		>
			<span
				className={`
					text-[11px]
					leading-none

					${style.star}
				`}
			>
				★
			</span>

			<span
				className={`
					text-[11px]
					font-semibold
					tabular-nums

					${style.text}
				`}
			>
				{rating.toFixed(1)}
			</span>
		</div>
	);
}
