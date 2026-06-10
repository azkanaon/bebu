"use client";

import clsx from "clsx";
import {
	ChevronLeft,
	ChevronRight,
	FileX,
	Clock,
	CheckCircle,
	XCircle,
	Eye,
} from "lucide-react";
import {
	BookSubmissionResponse,
	SubmissionQueryParams,
} from "@/types/book-management";
import BookCover from "@/components/BookCover";

interface SubmissionTableProps {
	data: BookSubmissionResponse[];
	loading: boolean;
	filters: SubmissionQueryParams;
	onFilterChange: (key: keyof SubmissionQueryParams, value: any) => void;
	totalPages: number;
	totalItems: number;
	onViewDetail: (sub: BookSubmissionResponse) => void;
	onApprove: (sub: BookSubmissionResponse) => void;
	onReject: (sub: BookSubmissionResponse) => void;
}

export default function SubmissionTable({
	data,
	loading,
	filters,
	onFilterChange,
	totalPages,
	totalItems,
	onViewDetail,
	onApprove,
	onReject,
}: SubmissionTableProps) {
	const safeData = data || [];

	if (loading) {
		return (
			<div className="flex h-[320px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
				<div className="flex items-center gap-3 text-sm text-zinc-400">
					<div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
					Loading community book submissions records...
				</div>
			</div>
		);
	}

	if (safeData.length === 0) {
		return (
			<div className="flex h-[320px] flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/[0.02] text-center">
				<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] text-zinc-500">
					<FileX size={24} />
				</div>
				<div>
					<h3 className="text-sm font-medium text-zinc-200">
						No submissions found
					</h3>
					<p className="mt-1 text-xs text-zinc-500">
						Try adjusting your search keywords or filters.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
				<div className="grid grid-cols-12 border-b border-white/5 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
					<div className="col-span-4">Proposed Book / ISBN</div>
					<div className="col-span-3">Submitted By</div>
					<div className="col-span-2">Status</div>
					<div className="col-span-3 text-right">Actions</div>
				</div>

				<div className="divide-y divide-white/[0.03]">
					{safeData.map((sub) => (
						<div
							key={sub.book_submission_id}
							className="group grid w-full grid-cols-12 items-center px-6 py-4 text-left transition-all duration-200 hover:bg-white/[0.01]"
						>
							<div className="col-span-4 pr-6">
								<div className="flex items-center gap-3">
									<div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md border border-white/10 bg-zinc-800">
										<BookCover
											src={sub.cover_img_url}
											title={sub.title}
											fill
											sizes="36px"
										/>
									</div>
									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-zinc-100 group-hover:text-purple-300 transition-colors duration-200">
											{sub.title}
										</p>
										<p className="truncate text-xs text-zinc-400 mt-0.5 font-normal">
											By{" "}
											{sub.authors &&
											sub.authors.length > 0
												? sub.authors
														.map(
															(author) =>
																author.name,
														)
														.join(", ")
												: "Unknown Author"}
										</p>
										<p className="text-[10px] text-zinc-500 mt-0.5">
											ISBN:{" "}
											<span className="text-zinc-400 font-mono">
												{sub.isbn || "-"}
											</span>
										</p>
									</div>
								</div>
							</div>

							<div className="col-span-3 pr-4">
								<span className="text-xs text-zinc-300 font-medium block truncate">
									{sub.submitted_by}
								</span>
								<span className="text-[10px] text-zinc-500 block mt-0.5">
									{sub.created_at
										? new Date(
												sub.created_at,
											).toLocaleDateString("id-ID", {
												dateStyle: "medium",
											})
										: "-"}
								</span>
							</div>

							<div className="col-span-2">
								<div
									className={clsx(
										"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
										sub.status === "approved"
											? "border-emerald-500/15 bg-emerald-500/[0.08] text-emerald-300"
											: sub.status === "pending"
												? "border-amber-500/15 bg-amber-500/[0.08] text-amber-300"
												: "border-red-500/15 bg-red-500/[0.08] text-red-400",
									)}
								>
									{sub.status === "approved" && (
										<CheckCircle size={11} />
									)}
									{sub.status === "pending" && (
										<Clock size={11} />
									)}
									{(sub.status === "rejected" ||
										sub.status === "duplicate") && (
										<XCircle size={11} />
									)}
									{sub.status}
								</div>
							</div>

							<div className="col-span-3 flex items-center justify-end gap-3">
								<button
									onClick={() => onViewDetail(sub)}
									title="View / Review Details"
									className="p-2 rounded-xl border border-white/5 bg-white/[0.02] text-zinc-400 hover:border-purple-500/30 hover:text-purple-300 transition-all duration-150 flex items-center gap-1.5 text-xs font-medium"
								>
									<Eye size={14} />
									<span className="hidden sm:inline">
										Review
									</span>
								</button>
								{sub.status === "pending" && (
									<>
										<button
											onClick={() => onApprove(sub)}
											className="text-[11px] font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 px-2.5 py-1.5 rounded-xl transition-all duration-150"
										>
											Accept
										</button>
										<button
											onClick={() => onReject(sub)}
											className="text-[11px] font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/15 px-2.5 py-1.5 rounded-xl transition-all duration-150"
										>
											Reject
										</button>
									</>
								)}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* PAGINATION */}
			<div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-2 text-xs">
					<div className="h-1.5 w-1.5 rounded-full bg-purple-400/70" />
					<p className="text-zinc-500">
						Inboxes ·{" "}
						<span className="font-medium text-zinc-300">
							{totalItems}
						</span>{" "}
						community submissions
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
												? "border border-purple-500/20 bg-purple-500/[0.10] text-purple-200"
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
		</div>
	);
}
