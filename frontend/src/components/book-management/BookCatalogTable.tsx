"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
	ChevronLeft,
	ChevronRight,
	FileX,
	Trash2,
	Calendar,
	Edit3,
} from "lucide-react";
import { BookResponse, BookQueryParams } from "@/types/book-management";
import BookDeleteModal from "@/components/book-management/BookDeleteModal";
import ClientPortal from "../ClientPortal";
import BookCover from "@/components/BookCover";

interface BookCatalogTableProps {
	data: BookResponse[];
	loading: boolean;
	filters: BookQueryParams;
	onFilterChange: (key: keyof BookQueryParams, value: any) => void;
	totalPages: number;
	totalItems: number;
	onEdit: (book: BookResponse) => void;
	onDelete: (id: number) => Promise<void> | void; // Menjaga kompabilitas async trigger dari parent
}

export default function BookCatalogTable({
	data,
	loading,
	filters,
	onFilterChange,
	totalPages,
	totalItems,
	onEdit,
	onDelete,
}: BookCatalogTableProps) {
	const safeData = data || [];

	// State lokal untuk melacak buku mana yang sedang akan dihapus oleh admin
	const [deleteTarget, setDeleteTarget] = useState<BookResponse | null>(null);

	if (loading) {
		return (
			<div className="flex h-[400px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
				<div className="flex items-center gap-3 text-sm text-zinc-400">
					<div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
					Loading core verified catalogs registry records...
				</div>
			</div>
		);
	}

	if (safeData.length === 0) {
		return (
			<div className="flex h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/[0.02] text-center">
				<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] text-zinc-500">
					<FileX size={24} />
				</div>
				<div>
					<h3 className="text-sm font-medium text-zinc-200">
						No catalog books match criteria
					</h3>
					<p className="mt-1 text-xs text-zinc-500">
						Try modifying your master search query strings.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
				<div className="grid grid-cols-12 border-b border-white/5 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
					<div className="col-span-5">Verified Book Title</div>
					<div className="col-span-3">Authors</div>
					<div className="col-span-2">Genres Spec</div>
					<div className="col-span-2 text-right">Actions</div>
				</div>

				<div className="divide-y divide-white/[0.03]">
					{safeData.map((book) => (
						<div
							key={book.book_id}
							className="group grid w-full grid-cols-12 items-center px-6 py-4 text-left transition-all duration-200 hover:bg-white/[0.01]"
						>
							{/* COVER & CLUSTER INFO */}
							<div className="col-span-5 pr-6 flex items-center gap-3">
								<div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md border border-white/10 bg-zinc-800">
									<BookCover
										src={book.cover_img_url}
										title={book.title}
										fill
										sizes="36px"
									/>
								</div>
								<div className="min-w-0">
									<Link
										href={`/books/${book.slug}`}
										className="block group/title" // Tambahkan utility class block agar mempermudah klik
									>
										<p className="truncate text-sm font-medium text-zinc-100 group-hover/title:text-blue-300 group-hover:text-blue-300 transition-colors duration-200 cursor-pointer">
											{book.title}
										</p>
									</Link>
									<div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
										<span className="flex items-center gap-1">
											<Calendar
												size={11}
												className="text-zinc-600"
											/>
											{book.publication_year || "-"}
										</span>
										<span>•</span>
										<span className="uppercase text-[10px] tracking-wider text-zinc-500 font-semibold">
											{book.language || "en"}
										</span>
										<span>•</span>
										<span>{book.total_pages || 0} pgs</span>
									</div>
								</div>
							</div>

							{/* AUTHORS */}
							<div className="col-span-3 pr-4">
								<p className="text-xs text-zinc-300 font-medium truncate">
									{book.authors?.join(", ") || "-"}
								</p>
							</div>

							{/* GENRES */}
							<div className="col-span-2 pr-2">
								<div className="flex flex-wrap gap-1 max-w-[160px]">
									{book.genres
										?.slice(0, 2)
										.map((genre, idx) => (
											<span
												key={idx}
												className="inline-flex items-center rounded-md bg-blue-500/5 px-1.5 py-0.5 text-[10px] font-medium text-blue-400 ring-1 ring-inset ring-blue-500/10 truncate max-w-[70px]"
											>
												{genre}
											</span>
										))}
									{book.genres && book.genres.length > 2 && (
										<span className="text-[9px] font-semibold text-zinc-600 self-center">
											+{book.genres.length - 2}
										</span>
									)}
								</div>
							</div>

							{/* ACTIONS: EDIT & DELETE */}
							<div className="col-span-2 flex justify-end items-center gap-2">
								<button
									onClick={() => onEdit(book)}
									title="Edit Book Master"
									className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-zinc-400 transition-all duration-150 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-300"
								>
									<Edit3 size={13} />
								</button>
								<button
									onClick={() => setDeleteTarget(book)} // Tidak lagi memicu confirm() bawaan, melainkan menyimpan data ke state
									title="Purge Record"
									className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-400 transition-all duration-150 hover:bg-rose-500 hover:text-zinc-950"
								>
									<Trash2 size={13} />
								</button>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* PAGINATION */}
			<div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-2 text-xs">
					<div className="h-1.5 w-1.5 rounded-full bg-blue-400/70" />
					<p className="text-zinc-500">
						Catalog Ledger ·{" "}
						<span className="font-medium text-zinc-300">
							{totalItems}
						</span>{" "}
						verified master items
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={() =>
							onFilterChange(
								"page",
								Math.max(filters.page - 1, 1),
							)
						}
						disabled={filters.page === 1}
						className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-zinc-400 disabled:opacity-30"
					>
						<ChevronLeft size={16} />
					</button>
					<div className="flex items-center gap-1">
						{Array.from({ length: totalPages }, (_, i) => {
							const p = i + 1;
							if (
								p === 1 ||
								p === totalPages ||
								Math.abs(filters.page - p) <= 1
							) {
								return (
									<button
										key={p}
										onClick={() =>
											onFilterChange("page", p)
										}
										className={clsx(
											"h-9 w-9 rounded-xl text-sm font-medium",
											filters.page === p
												? "border border-blue-500/20 bg-blue-500/[0.10] text-blue-200"
												: "text-zinc-500 hover:text-white",
										)}
									>
										{p}
									</button>
								);
							}
							if (p === 2 || p === totalPages - 1)
								return (
									<span
										key={p}
										className="px-1 text-zinc-600"
									>
										...
									</span>
								);
							return null;
						})}
					</div>
					<button
						onClick={() =>
							onFilterChange(
								"page",
								Math.min(filters.page + 1, totalPages),
							)
						}
						disabled={filters.page === totalPages}
						className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-zinc-400 disabled:opacity-30"
					>
						<ChevronRight size={16} />
					</button>
				</div>
			</div>

			{/* CUSTOM DELETE CONFIRMATION MODAL */}
			<ClientPortal>
				<BookDeleteModal
					isOpen={!!deleteTarget}
					book={deleteTarget}
					onClose={() => setDeleteTarget(null)}
					onConfirm={async (id) => {
						await onDelete(id); // Menjalankan fungsi onDelete yang dikirim dari parent component
					}}
				/>
			</ClientPortal>
		</div>
	);
}
