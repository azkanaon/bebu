import React from "react";
import { BookStatDTO } from "@/types/book";
import { Star } from "lucide-react";

interface BookRatingStatsProps {
	stats: BookStatDTO;
}

export const BookRatingStats: React.FC<BookRatingStatsProps> = ({ stats }) => {
	const {
		overall_rating,
		total_reviews,
		rating_1_count,
		rating_2_count,
		rating_3_count,
		rating_4_count,
		rating_5_count,
	} = stats;

	const ratings = [
		{ star: 5, count: rating_5_count },
		{ star: 4, count: rating_4_count },
		{ star: 3, count: rating_3_count },
		{ star: 2, count: rating_2_count },
		{ star: 1, count: rating_1_count },
	];

	const maxCount = Math.max(...ratings.map((r) => r.count), 1);

	return (
		<section className="mt-4 border-y border-white/[0.08] py-4">
			<div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_minmax(0,1fr)]">
				{/* LEFT */}
				<div
					className="
						flex
						flex-col
						items-center
						justify-center
						text-center
						md:border-r
						md:border-white/[0.08]
						md:pr-8
					"
				>
					<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
						Overall Rating
					</p>

					<div className="mt-2 flex items-end gap-1">
						<span className="text-5xl font-bold tracking-[-0.04em] text-white/95">
							{overall_rating.toFixed(1)}
						</span>

						<span className="mb-1 text-base text-slate-500">
							/5
						</span>
					</div>

					<div className="mt-2 flex items-center gap-1">
						{[...Array(5)].map((_, i) => (
							<Star
								key={i}
								size={15}
								className={
									i < Math.round(overall_rating)
										? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.50)]"
										: "text-slate-700"
								}
							/>
						))}
					</div>

					<p className="mt-2 text-[13px] text-slate-400">
						<span className="font-medium text-slate-300">
							{total_reviews.toLocaleString()}
						</span>{" "}
						reviews
					</p>
				</div>

				{/* RIGHT */}
				<div className="space-y-3">
					{ratings.map((item) => {
						const barWidth = (item.count / maxCount) * 100;

						return (
							<div
								key={item.star}
								className="group flex items-center gap-3"
							>
								{/* STAR LABEL */}
								<div className="flex w-10 shrink-0 items-center gap-1">
									<span className="text-[13px] font-semibold text-slate-300">
										{item.star}
									</span>

									<Star
										size={11}
										className="fill-amber-400/70 text-amber-400/70"
									/>
								</div>

								{/* BAR */}
								<div
									className="
										h-2
										flex-1
										overflow-hidden
										rounded-full
										bg-white/[0.04]
									"
								>
									<div
										className="
											h-full
											rounded-full
											bg-gradient-to-r
											from-indigo-500/90
											to-blue-400/90
											shadow-[0_0_10px_rgba(99,102,241,0.25)]
											transition-all
											duration-700
											group-hover:brightness-110
										"
										style={{
											width: `${barWidth}%`,
										}}
									/>
								</div>

								{/* COUNT */}
								<span
									className="
										w-14
										text-right
										text-[12px]
										font-medium
										text-slate-500
										transition-colors
										group-hover:text-slate-300
									"
								>
									{item.count.toLocaleString()}
								</span>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};
