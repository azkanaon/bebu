import React from "react";
import { BookStatDTO } from "@/types/book";
import { Star } from "lucide-react"; // Pastikan sudah install lucide-react atau gunakan SVG biasa

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

	// Mencari jumlah bintang dengan count terbesar sebagai acuan lebar bar (100%)
	const maxCount = Math.max(...ratings.map((r) => r.count), 1);

	return (
		<section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-6 border-y border-slate-800/50">
			{/* BAGIAN 2: Overall Rating (Sisi Kiri) */}
			<div className="md:col-span-4 flex flex-col items-center justify-center text-center space-y-2 border-r-0 md:border-r border-slate-800/60">
				<h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
					Rating Keseluruhan
				</h3>
				<div className="flex items-baseline gap-1">
					<span className="text-6xl font-bold text-white">
						{overall_rating.toFixed(1)}
					</span>
					<span className="text-slate-500 text-xl">/ 5</span>
				</div>

				{/* Visual Bintang (Disederhanakan) */}
				<div className="flex gap-1">
					{[...Array(5)].map((_, i) => (
						<Star
							key={i}
							size={18}
							className={
								i < Math.round(overall_rating)
									? "fill-yellow-500 text-yellow-500"
									: "text-slate-700"
							}
						/>
					))}
				</div>

				<p className="text-xs text-slate-400">
					Dihitung dari {total_reviews.toLocaleString()} ulasan
				</p>
			</div>

			{/* BAGIAN 3: Rating Breakdown (Sisi Kanan) */}
			<div className="md:col-span-8 space-y-3 px-0 md:px-6">
				{ratings.map((item) => {
					// Menghitung persentase relatif terhadap maxCount
					const barWidth = (item.count / maxCount) * 100;

					return (
						<div
							key={item.star}
							className="flex items-center gap-4 group"
						>
							{/* Label Bintang */}
							<div className="flex items-center gap-1 w-10 shrink-0">
								<span className="text-xs font-bold text-slate-300">
									{item.star}
								</span>
								<Star
									size={12}
									className="fill-slate-500 text-slate-500"
								/>
							</div>

							{/* Progress Bar Container */}
							<div className="flex-1 h-2 bg-slate-800/50 rounded-full overflow-hidden">
								<div
									className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
									style={{ width: `${barWidth}%` }}
								/>
							</div>

							{/* Angka Jumlah Bintang */}
							<span className="text-xs font-medium text-slate-500 w-12 text-right group-hover:text-slate-300 transition-colors">
								{item.count.toLocaleString()}
							</span>
						</div>
					);
				})}
			</div>
		</section>
	);
};
