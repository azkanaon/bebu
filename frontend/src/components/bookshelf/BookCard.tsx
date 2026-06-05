'use client'

import { motion } from 'framer-motion'
import { BookshelfItem } from '@/types/bookshelf'
import BookCover from "@/components/BookCover";

interface BookCardProps {
  item: BookshelfItem
  onClick: (item: BookshelfItem) => void
}

export default function BookCard({ item, onClick }: BookCardProps) {
  return (
		<motion.div
			onClick={() => onClick(item)}
			className="bg-[#0B1220]/60 border border-white/5 p-3 rounded-2xl flex flex-row sm:flex-col gap-4 cursor-pointer hover:border-blue-500/20 transition-all group"
		>
			{/* Cover Buku */}
			<div className="relative w-20 h-28 sm:h-fit sm:w-full sm:aspect-4/5 rounded-xl overflow-hidden border border-white/5 shadow-lg bg-white/5 shrink-0">
				<BookCover
					src={item.book.coverImgUrl}
					title={item.book.title}
					fill
					className="group-hover:scale-105 transition-transform duration-700"
				/>

				{/* Progress Overlay (Hanya muncul di desktop karena di mobile nanti ada bar panjang) */}
				<div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 hidden sm:block">
					<p className="text-[10px] text-slate-200 font-medium">
						{item.progress}%
					</p>
				</div>
			</div>

			{/* Info Buku */}
			<div className="flex flex-col justify-center sm:justify-start flex-1 min-w-0">
				<h3 className="text-slate-100 font-semibold text-sm sm:text-base leading-tight truncate sm:whitespace-normal sm:line-clamp-2 group-hover:text-blue-400 transition-colors">
					{item.book.title}
				</h3>
				<p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">
					{item.book.authors.join(", ")}
				</p>

				{/* Progress Section (Lebih dominan di Mobile) */}
				<div className="mt-3 sm:mt-4 space-y-1.5">
					<div className="flex justify-between items-center sm:hidden">
						<span className="text-[10px] text-slate-500 font-medium">
							Reading progress
						</span>
						<span className="text-[10px] text-blue-400 font-bold">
							{item.progress}%
						</span>
					</div>
					<div className="h-1.5 sm:h-1 w-full bg-white/5 rounded-full overflow-hidden">
						<motion.div
							initial={{ width: 0 }}
							animate={{ width: `${item.progress}%` }}
							className="h-full bg-blue-500/80"
						/>
					</div>
				</div>
			</div>
		</motion.div>
  );
}
