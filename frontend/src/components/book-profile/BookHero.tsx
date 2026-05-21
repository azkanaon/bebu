import React from "react";
import { BookProfileData } from "@/types/book";

interface BookHeroProps {
	book: BookProfileData;
}

export const BookHero: React.FC<BookHeroProps> = ({ book }) => {
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
		<section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start w-full text-slate-200">
			{/* Kolom Cover Buku (3/12 Space) */}
			<div className="md:col-span-3 w-full max-w-[180px] mx-auto md:mx-0 rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-900/40">
				<img
					src={cover_img_url || "/placeholder-cover.jpg"}
					alt={`Cover buku ${title}`}
					className="w-full h-auto object-cover aspect-[2/3] transform hover:scale-102 transition-transform duration-300"
					loading="eager"
				/>
			</div>

			{/* Kolom Informasi Buku (9/12 Space) */}
			<div className="md:col-span-9 space-y-4">
				<div className="space-y-1">
					{/* List Genre / Tags (Sesuai dengan tag ungu pudar di UI kamu) */}
					<div className="flex flex-wrap gap-2 mb-2">
						{genres.map((g) => (
							<span
								key={g.slug}
								className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded text-xs font-medium transition-colors"
							>
								{g.genre_name}
							</span>
						))}
					</div>

					{/* Judul Buku */}
					<h1 className="text-3xl font-bold text-white tracking-tight">
						{title}
					</h1>

					{/* Penulis */}
					<p className="text-sm text-slate-400">
						Ditulis oleh{" "}
						<span className="font-medium text-slate-300 hover:text-indigo-400 transition-colors cursor-pointer">
							{authors.map((a) => a.author_name).join(", ")}
						</span>
					</p>
				</div>

				{/* Metadata Grid (Sesuai dengan box abu-abu transparan di UI kamu) */}
				<div className="grid grid-cols-3 gap-2 p-3.5 bg-slate-800/40 border border-slate-700/40 rounded-xl text-center max-w-sm">
					<div className="flex flex-col">
						<span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
							Tahun
						</span>
						<span className="text-xs font-medium text-slate-300 mt-0.5">
							{publication_year}
						</span>
					</div>
					<div className="flex flex-col border-x border-slate-700/60">
						<span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
							Bahasa
						</span>
						<span className="text-xs font-medium text-slate-300 mt-0.5 truncate px-1">
							{language}
						</span>
					</div>
					<div className="flex flex-col">
						<span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
							Halaman
						</span>
						<span className="text-xs font-medium text-slate-300 mt-0.5">
							{total_pages} hlm
						</span>
					</div>
				</div>

				{/* Sinopsis */}
				<div className="space-y-1.5 pt-1">
					<h2 className="text-sm font-bold text-slate-300 tracking-wide uppercase text-xs">
						Sinopsis Buku
					</h2>
					<p className="text-slate-400 text-sm leading-relaxed text-justify whitespace-pre-line">
						{synopsis || "Belum ada sinopsis untuk buku ini."}
					</p>
				</div>
			</div>
		</section>
	);
};
