"use client";

import React, { useState } from "react";
import { BookProfileData } from "@/types/book";
import { CalendarDays, BookOpen, Languages } from "lucide-react";
import BookCover from "@/components/BookCover";

interface BookHeroProps {
	book: BookProfileData;
}

export const BookHero: React.FC<BookHeroProps> = ({ book }) => {
	const [expanded, setExpanded] = useState(false);
	
	const {
		title,
		cover_img_url,
		synopsis,
		publication_year,
		language,
		total_pages,
		authors,
		genres,
	} = book;

	return (
		<section className="w-full text-slate-200 mt-4">
			{/* TOP SECTION */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-[140px_minmax(0,1fr)]">
				{/* COVER */}
				<div className="group relative w-full max-w-[140px]">
					{/* Ambient Glow */}
					<div className="absolute inset-0 rounded-md bg-indigo-500/10 blur-2xl transition-all duration-500 group-hover:bg-indigo-500/15" />

					{/* IMAGE */}
					<div
						className="
							relative
							w-full
							overflow-hidden
							rounded-md
							border border-white/10
							bg-slate-900/40
							aspect-[2/3]
							shadow-[0_20px_60px_rgba(0,0,0,0.35)]
						"
					>
						<BookCover
							src={cover_img_url}
							title={title}
							fill // Menggantikan h-full w-full agar otomatis memenuhi parent div
							className="transition-transform duration-700 group-hover:scale-[1.02]"
						/>

						<div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
					</div>
				</div>

				{/* RIGHT CONTENT */}
				<div className="flex flex-col">
					{/* TITLE */}
					<h1
						className="
        max-w-4xl
        line-clamp-2 /* Berikan ruang hingga 2 atau 3 baris */
        text-[clamp(1.5rem,3.2vw,2.7rem)] /* Ukuran font disesuaikan sedikit agar lebih elegan saat multi-line */
        font-bold
        leading-[1.1] /* Berikan sedikit ruang antar baris jika nge-wrap */
        tracking-tight
        text-white/95
    "
						title={
							title
						} /* Native tooltip bawaan browser sebagai fallback aman */
					>
						{title}
					</h1>

					{/* AUTHOR */}
					<p className="mt-2 text-[16px] text-slate-400 flex flex-wrap gap-x-1.5 gap-y-1">
						<span>Written by</span>
						{authors.map((a, index) => (
							<span
								key={a.slug || index}
								className="inline-flex items-center"
							>
								<a className="font-medium text-slate-200 transition-colors hover:text-indigo-300">
									{a.author_name}
								</a>
								{/* Tambahkan koma jika bukan author terakhir */}
								{index < authors.length - 1 && (
									<span className="text-slate-400">,</span>
								)}
							</span>
						))}
					</p>

					{/* GENRES */}
					{genres.length > 0 && (
						/* 1. Tambahkan pembungkus dengan class relative di sini */
						<div className="relative mt-4">
							{/* Kontainer scroll kamu yang lama (hapus mt-4 dari sini karena sudah dipindah ke atas) */}
							<div
								className="
									flex
									gap-2
									overflow-x-auto
									scroll-smooth
									pb-1
									[scrollbar-width:none]
									[-ms-overflow-style:none]
									[&::-webkit-scrollbar]:hidden
								"
							>
								{genres.map((g) => (
									<span
										key={g.slug}
										className="
											shrink-0
											rounded-md
											border border-blue-500/20
											bg-blue-500/10
											px-2.5 py-0.5
											text-[13px]
											font-medium
											tracking-wide
											text-blue-300
											backdrop-blur-sm
											transition-colors
											duration-300
											hover:bg-blue-500/20
										"
									>
										{g.genre_name}
									</span>
								))}
							</div>

							{/* 2. Taruh elemen edge fade ini di bawah kontainer scroll, tapi masih di dalam pembungkus relative */}
							<div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-[#050816] to-transparent" />
						</div>
					)}

					{/* METADATA */}
					<div
						className="
							mt-4
							grid
							grid-cols-3
							overflow-hidden
							rounded-xl
							border border-white/5
							bg-gradient-to-br from-white/[0.05] to-white/[0.02]
							backdrop-blur-xl
							shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]
						"
					>
						<div className="flex flex-col items-center gap-1.5 px-4 py-3 text-center">
							<div className="flex items-center justify-center gap-1.5 text-slate-500">
								<CalendarDays size={13} />

								<span className="text-[9px] uppercase tracking-[0.16em]">
									Publish Year
								</span>
							</div>

							<p className="text-[15px] font-semibold text-white">
								{publication_year}
							</p>
						</div>

						<div className="flex flex-col items-center gap-1.5 border-x border-white/5 px-4 py-3 text-center">
							<div className="flex items-center justify-center gap-1.5 text-slate-500">
								<Languages size={13} />

								<span className="text-[9px] uppercase tracking-[0.16em]">
									Language
								</span>
							</div>

							<p className="truncate text-[15px] font-semibold text-white">
								{language}
							</p>
						</div>

						<div className="flex flex-col items-center gap-1.5 px-4 py-3 text-center">
							<div className="flex items-center justify-center gap-1.5 text-slate-500">
								<BookOpen size={13} />

								<span className="text-[9px] uppercase tracking-[0.16em]">
									Total Pages
								</span>
							</div>

							<p className="text-[15px] font-semibold text-white">
								{total_pages}
								<span className="ml-1 text-slate-400">
									pages
								</span>
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* SYNOPSIS */}
			<div
				className="
		mt-4
		rounded-2xl
		border border-white/5
		bg-gradient-to-br from-white/[0.05] to-white/[0.02]
		p-5
		backdrop-blur-xl
		shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]
	"
			>
				<h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
					Book Synopsis
				</h2>

				<p
					className={`
			mt-3
			max-w-5xl
			text-[15px]
			leading-7
			text-slate-300/90
			transition-all
			duration-300
			${!expanded ? "line-clamp-4" : ""}
		`}
				>
					{synopsis || "Belum ada sinopsis untuk buku ini."}
				</p>

				{synopsis && synopsis.length > 220 && (
					<button
						onClick={() => setExpanded(!expanded)}
						className="
				mt-3
				text-sm
				font-medium
				text-indigo-300
				transition-colors
				hover:text-indigo-200
			"
					>
						{expanded ? "Show less" : "Read more"}
					</button>
				)}
			</div>
		</section>
	);
};
