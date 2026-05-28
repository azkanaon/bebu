"use client";

import clsx from "clsx";
import {
	ChevronLeft,
	ChevronRight,
	FileX,
	MessageSquare,
	Heart,
	EyeOff,
	Globe,
	Trash2,
} from "lucide-react";
import Image from "next/image";

import { PostManageableResponse } from "@/types/post-management";

interface PostTableProps {
	data: PostManageableResponse[];
	loading: boolean;
	onSelect: (post: PostManageableResponse) => void;
	currentPage: number;
	totalPages: number;
	totalItems: number;
	onPageChange: (page: number) => void;
}

export default function PostTable({
	data,
	loading,
	onSelect,
	currentPage,
	totalPages,
	totalItems,
	onPageChange,
}: PostTableProps) {
	const safeData = data || [];

	// State Loading Skeleton
	if (loading) {
		return (
			<div className="flex h-[400px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
				<div className="flex items-center gap-3 text-sm text-zinc-400">
					<div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
					Loading post registry database records...
				</div>
			</div>
		);
	}

	// State Empty / Data tidak ditemukan
	if (safeData.length === 0) {
		return (
			<div className="flex h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/[0.02] text-center">
				<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] text-zinc-500">
					<FileX size={24} />
				</div>
				<div>
					<h3 className="text-sm font-medium text-zinc-200">
						No posts match criteria
					</h3>
					<p className="mt-1 text-xs text-zinc-500">
						Try adjusting your search query or publication status
						filters.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* STRUCTURED DATA GRID TABLE */}
			<div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
				{/* HEADERS */}
				<div className="grid grid-cols-12 border-b border-white/5 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
					<div className="col-span-4">Post Content / Review</div>
					<div className="col-span-2">Author</div>
					<div className="col-span-2">Engagement</div>
					<div className="col-span-2">Published At</div>
					<div className="col-span-2 text-right">Status</div>
				</div>

				{/* DATA ROWS */}
				<div className="divide-y divide-white/[0.03]">
					{safeData.map((post) => (
						<button
							key={post.post_id}
							onClick={() => onSelect(post)}
							className="group grid w-full grid-cols-12 items-center px-6 py-4 text-left transition-all duration-200 hover:bg-white/[0.03]"
						>
							{/* POST CONTENT & BOOK COVER */}
							<div className="col-span-4 pr-6">
								<div className="flex items-center gap-3">
									<div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md border border-white/10 bg-zinc-800">
										<Image
											src={
												post.img_url ||
												"/book-placeholder.png"
											}
											alt={
												post.book_title || "Post Image"
											}
											fill
											sizes="36px"
											className="object-cover"
										/>
									</div>

									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-zinc-100 group-hover:text-blue-300 transition-colors duration-200">
											{post.book_title ||
												"Untitled Review"}
										</p>
										<p className="truncate text-xs text-zinc-400 mt-0.5 font-normal">
											{post.description || (
												<span className="italic text-zinc-600">
													No description
												</span>
											)}
										</p>
										<p className="text-[10px] text-zinc-500 mt-0.5">
											Type:{" "}
											<span className="text-zinc-400 uppercase tracking-wider font-semibold text-[9px]">
												{post.post_type}
											</span>
										</p>
									</div>
								</div>
							</div>

							{/* AUTHOR */}
							<div className="col-span-2">
								<span className="text-xs text-zinc-300 font-medium">
									@{post.username}
								</span>
							</div>

							{/* ENGAGEMENT METRICS */}
							<div className="col-span-2">
								<div className="flex flex-col gap-1 text-xs text-zinc-400">
									<div className="flex items-center gap-1.5">
										<Heart
											size={13}
											className="text-rose-500/80"
										/>
										<span>
											{post.like_count ?? 0}{" "}
											<span className="text-[10px] text-zinc-600">
												likes
											</span>
										</span>
									</div>
									<div className="flex items-center gap-1.5">
										<MessageSquare
											size={13}
											className="text-blue-400/80"
										/>
										<span>
											{post.comment_count ?? 0}{" "}
											<span className="text-[10px] text-zinc-600">
												replies
											</span>
										</span>
									</div>
								</div>
							</div>

							{/* PUBLISHED AT TIMESTAMP */}
							<div className="col-span-2">
								<p className="text-xs text-zinc-400">
									{post.created_at ? (
										new Date(
											post.created_at,
										).toLocaleString("id-ID", {
											dateStyle: "medium",
											timeStyle: "short",
										})
									) : (
										<span className="text-zinc-600 italic">
											Unknown
										</span>
									)}
								</p>
							</div>

							{/* PUBLISH STATUS */}
							<div className="col-span-2 flex justify-end">
								<div
									className={clsx(
										"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
										post.publish_status === "published"
											? "border-emerald-500/15 bg-emerald-500/[0.08] text-emerald-300"
											: post.publish_status ===
												  "shadowbanned"
												? "border-amber-500/15 bg-amber-500/[0.08] text-amber-300"
												: "border-red-500/15 bg-red-500/[0.08] text-red-400",
									)}
								>
									{post.publish_status === "published" && (
										<Globe size={11} />
									)}
									{post.publish_status === "shadowbanned" && (
										<EyeOff size={11} />
									)}
									{post.publish_status === "soft_deleted" && (
										<Trash2 size={11} />
									)}
									{post.publish_status?.replace("_", " ")}
								</div>
							</div>
						</button>
					))}
				</div>
			</div>

			{/* PAGINATION METRICS CONTROL */}
			<div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-2 text-xs">
					<div className="h-1.5 w-1.5 rounded-full bg-blue-400/70" />
					<p className="text-zinc-500">
						Content Ledger ·{" "}
						<span className="font-medium text-zinc-300">
							{totalItems}
						</span>{" "}
						community publications
					</p>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={() =>
							onPageChange(Math.max(currentPage - 1, 1))
						}
						disabled={currentPage === 1}
						className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-zinc-400 transition-all duration-200 hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-30"
					>
						<ChevronLeft size={16} />
					</button>

					<div className="flex items-center gap-1">
						{Array.from({ length: totalPages }, (_, index) => {
							const pageNum = index + 1;
							if (
								pageNum === 1 ||
								pageNum === totalPages ||
								Math.abs(currentPage - pageNum) <= 1
							) {
								return (
									<button
										key={pageNum}
										onClick={() => onPageChange(pageNum)}
										className={clsx(
											"h-9 w-9 rounded-xl text-sm font-medium transition-all duration-200",
											currentPage === pageNum
												? "border border-blue-500/20 bg-blue-500/[0.10] text-blue-200"
												: "text-zinc-500 hover:bg-white/[0.04] hover:text-white",
										)}
									>
										{pageNum}
									</button>
								);
							}

							if (pageNum === 2 || pageNum === totalPages - 1) {
								return (
									<span
										key={pageNum}
										className="px-1 text-zinc-600"
									>
										...
									</span>
								);
							}
							return null;
						})}
					</div>

					<button
						onClick={() =>
							onPageChange(Math.min(currentPage + 1, totalPages))
						}
						disabled={currentPage === totalPages}
						className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-zinc-400 transition-all duration-200 hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-30"
					>
						<ChevronRight size={16} />
					</button>
				</div>
			</div>
		</div>
	);
}
