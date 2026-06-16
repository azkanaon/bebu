"use client";

import clsx from "clsx";
import {
	Clock,
	CheckCircle2,
	XCircle,
	ShieldAlert,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { AdminAppealList } from "@/types/appeal";

interface AppealTableProps {
	data: AdminAppealList[];
	loading: boolean;
	onSelectReview: (id: number) => void;
	currentPage: number;
	totalPages: number;
	totalItems: number;
	onPageChange: (page: number) => void;
}

export default function AppealTable({
	data,
	loading,
	onSelectReview,
	currentPage,
	totalPages,
	totalItems,
	onPageChange,
}: AppealTableProps) {
	const safeData = data || [];

	// State Loading Skeleton
	if (loading) {
		return (
			<div className="flex h-[400px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
				<div className="flex items-center gap-3 text-sm text-zinc-400">
					<div className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
					Loading appeal registry...
				</div>
			</div>
		);
	}

	// State Empty / Data tidak ditemukan
	if (safeData.length === 0) {
		return (
			<div className="flex h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/[0.02] text-center">
				<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] text-zinc-500">
					<ShieldAlert size={24} />
				</div>
				<div>
					<h3 className="text-sm font-medium text-zinc-200">
						No appeals found
					</h3>
					<p className="mt-1 text-xs text-zinc-500">
						There are currently no active account appeals to review.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* TABLE */}
			<div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
				{/* HEADERS */}
				<div className="grid grid-cols-12 border-b border-white/5 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
					<div className="col-span-6">User Applicant</div>
					<div className="col-span-3">Submitted At</div>
					<div className="col-span-3 text-right">Review Status</div>
				</div>

				{/* DATA ROWS */}
				<div className="divide-y divide-white/[0.03]">
					{safeData.map((appeal) => (
						<button
							key={appeal.accountAppealID}
							onClick={() =>
								onSelectReview(appeal.accountAppealID)
							}
							className="group grid w-full grid-cols-12 items-center px-6 py-4 text-left transition-all duration-200 hover:bg-orange-500/[0.03]"
						>
							{/* USER INFO */}
							<div className="col-span-6">
								<p className="text-sm font-medium text-zinc-100 group-hover:text-orange-100 transition-colors">
									{appeal.displayName}
								</p>
								<p className="text-xs text-zinc-500">
									@{appeal.username}
								</p>
							</div>

							{/* CREATED AT */}
							<div className="col-span-3 text-xs text-zinc-400">
								{new Date(appeal.createdAt).toLocaleString(
									"id-ID",
									{
										dateStyle: "medium",
										timeStyle: "short",
									},
								)}
							</div>

							{/* STATUS BADGE */}
							<div className="col-span-3 flex justify-end">
								<span
									className={clsx(
										"inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
										appeal.status === "Pending"
											? "border-amber-500/15 bg-amber-500/[0.08] text-amber-300"
											: appeal.status === "Approved"
												? "border-emerald-500/15 bg-emerald-500/[0.08] text-emerald-300"
												: "border-red-500/15 bg-red-500/[0.08] text-red-400",
									)}
								>
									{appeal.status === "Pending" && (
										<Clock size={11} />
									)}
									{appeal.status === "Approved" && (
										<CheckCircle2 size={11} />
									)}
									{appeal.status === "Rejected" && (
										<XCircle size={11} />
									)}
									{appeal.status}
								</span>
							</div>
						</button>
					))}
				</div>
			</div>

			{/* PAGINATION PANEL */}
			<div
				className="
					flex flex-col gap-4
					rounded-2xl
					border border-white/10
					bg-white/[0.02]
					p-4

					sm:flex-row
					sm:items-center
					sm:justify-between
				"
			>
				<div className="flex items-center gap-2 text-xs">
					<div className="h-1.5 w-1.5 rounded-full bg-orange-400/70" />
					<p className="text-zinc-500">
						Appeal queue ·{" "}
						<span className="font-medium text-zinc-300">
							{totalItems}
						</span>{" "}
						total appeals
					</p>
				</div>

				<div className="flex items-center gap-2">
					{/* PREVIOUS PAGE BUTTON */}
					<button
						onClick={() =>
							onPageChange(Math.max(currentPage - 1, 1))
						}
						disabled={currentPage === 1}
						className="
							flex h-9 w-9 items-center justify-center
							rounded-xl
							border border-white/10
							bg-black/20
							text-zinc-400

							transition-all duration-200

							hover:border-white/20
							hover:text-white

							disabled:pointer-events-none
							disabled:opacity-30
						"
					>
						<ChevronLeft size={16} />
					</button>

					{/* PAGE NUMBERS */}
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
											`
												h-9 w-9 rounded-xl
												text-sm font-medium
			
												transition-all
												duration-200
											`,
											currentPage === pageNum
												? `
													border border-orange-500/20
													bg-orange-500/[0.10]
													text-orange-200
												`
												: `
													text-zinc-500
													hover:bg-white/[0.04]
													hover:text-white
												`,
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

					{/* NEXT PAGE BUTTON */}
					<button
						onClick={() =>
							onPageChange(Math.min(currentPage + 1, totalPages))
						}
						disabled={currentPage === totalPages}
						className="
							flex h-9 w-9 items-center justify-center
							rounded-xl
							border border-white/10
							bg-black/20
							text-zinc-400

							transition-all duration-200

							hover:border-white/20
							hover:text-white

							disabled:pointer-events-none
							disabled:opacity-30
						"
					>
						<ChevronRight size={16} />
					</button>
				</div>
			</div>
		</div>
	);
}
