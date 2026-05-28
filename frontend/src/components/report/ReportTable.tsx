"use client";

import clsx from "clsx";

import {
	ChevronLeft,
	ChevronRight,
	FileWarning,
	User,
	FileText,
} from "lucide-react";

import { ReportSummaryResponse } from "@/types/report";

interface ReportTableProps {
	data: ReportSummaryResponse[];
	loading: boolean;
	onSelect: (summaryID: number) => void;
	currentPage: number;
	totalPages: number;
	totalItems: number;
	onPageChange: (page: number) => void;
}

export default function ReportTable({
	data,
	loading,
	onSelect,
	currentPage,
	totalPages,
	totalItems,
	onPageChange,
}: ReportTableProps) {
	const safeData = data || [];

	const itemsPerPage = 10;

	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + safeData.length;

	if (loading) {
		return (
			<div
				className="
					flex h-[320px] items-center justify-center
					rounded-3xl
					border border-white/10
					bg-white/[0.02]
				"
			>
				<div className="flex items-center gap-3 text-sm text-zinc-400">
					<div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
					Loading moderation telemetry...
				</div>
			</div>
		);
	}

	if (safeData.length === 0) {
		return (
			<div
				className="
					flex h-[320px] flex-col items-center justify-center gap-4
					rounded-3xl
					border border-white/10
					bg-white/[0.02]
					text-center
				"
			>
				<div
					className="
						flex h-14 w-14 items-center justify-center
						rounded-2xl
						bg-white/[0.03]
						text-zinc-500
					"
				>
					<FileWarning size={24} />
				</div>

				<div>
					<h3 className="text-sm font-medium text-zinc-200">
						No active reports found
					</h3>

					<p className="mt-1 text-xs text-zinc-500">
						Incoming moderation reports will appear here.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* TABLE */}
			<div
				className="
					overflow-hidden rounded-3xl
					border border-white/10
					bg-white/[0.02]
				"
			>
				{/* HEADER */}
				<div
					className="
						grid grid-cols-12
						border-b border-white/5
						px-6 py-4

						text-[11px]
						font-semibold
						uppercase
						tracking-[0.18em]
						text-zinc-500
					"
				>
					<div className="col-span-4">Target</div>

					<div className="col-span-2">Entity</div>

					<div className="col-span-1 text-center">Reports</div>

					<div className="col-span-1 text-center">Unique</div>

					<div className="col-span-2">Last Activity</div>

					<div className="col-span-2 text-right">Status</div>
				</div>

				{/* ROWS */}
				<div className="divide-y divide-white/[0.03]">
					{safeData.map((report) => (
						<button
							key={report.report_summary_id}
							onClick={() => onSelect(report.report_summary_id)}
							className="
								group
								grid w-full grid-cols-12
								items-center

								px-6 py-4

								text-left

								transition-all
								duration-200

								hover:bg-white/[0.03]
							"
						>
							{/* TARGET */}
							<div className="col-span-4 pr-6">
								<div className="flex items-center gap-3">
									<div
										className={clsx(
											`
												flex h-10 w-10 shrink-0
												items-center justify-center
												rounded-2xl
												border
											`,
											report.entity_type === "user"
												? `
													border-blue-500/15
													bg-blue-500/[0.08]
													text-blue-300
												`
												: `
													border-purple-500/15
													bg-purple-500/[0.08]
													text-purple-300
												`,
										)}
									>
										{report.entity_type === "user" ? (
											<User size={16} />
										) : (
											<FileText size={16} />
										)}
									</div>

									<div className="min-w-0">
										<p
											className="
												truncate
												text-sm
												font-medium
												text-zinc-100

												transition-colors
												duration-200

												group-hover:text-white
											"
										>
											{report.target || (
												<span className="italic text-zinc-600">
													Deleted Target
												</span>
											)}
										</p>

										<p className="mt-0.5 text-xs text-zinc-500">
											Moderation target
										</p>
									</div>
								</div>
							</div>

							{/* ENTITY */}
							<div className="col-span-2">
								<span
									className={clsx(
										`
											inline-flex items-center
											rounded-full
											border

											px-2.5 py-1

											text-[10px]
											font-semibold
											uppercase
											tracking-[0.14em]
										`,
										report.entity_type === "user"
											? `
												border-blue-500/15
												bg-blue-500/[0.08]
												text-blue-300
											`
											: `
												border-purple-500/15
												bg-purple-500/[0.08]
												text-purple-300
											`,
									)}
								>
									{report.entity_type}
								</span>
							</div>

							{/* REPORTS */}
							<div className="col-span-1 text-center">
								<p className="text-sm font-semibold text-zinc-100">
									{report.total_reports}
								</p>
							</div>

							{/* UNIQUE */}
							<div className="col-span-1 text-center">
								<p className="text-sm text-zinc-400">
									{report.unique_reports}
								</p>
							</div>

							{/* LAST REPORT */}
							<div className="col-span-2">
								<p className="text-xs text-zinc-400">
									{new Date(
										report.last_report,
									).toLocaleString("id-ID", {
										dateStyle: "medium",
										timeStyle: "short",
									})}
								</p>
							</div>

							{/* STATUS */}
							<div className="col-span-2 flex justify-end">
								<div
									className={clsx(
										`
											inline-flex items-center
											rounded-full
											border

											px-3 py-1.5

											text-[11px]
											font-semibold
										`,
										report.status === "Resolved"
											? `
												border-emerald-500/15
												bg-emerald-500/[0.08]
												text-emerald-300
											`
											: report.status === "Dismissed"
												? `
													border-zinc-500/15
													bg-zinc-500/[0.08]
													text-zinc-300
												`
												: `
													border-orange-500/15
													bg-orange-500/[0.08]
													text-orange-300
												`,
									)}
								>
									{report.status}
								</div>
							</div>
						</button>
					))}
				</div>
			</div>

			{/* PAGINATION */}
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
					<div className="h-1.5 w-1.5 rounded-full bg-blue-400/70" />

					<p className="text-zinc-500">
						Moderation queue ·{" "}
						<span className="font-medium text-zinc-300">
							{totalItems}
						</span>{" "}
						total reports
					</p>
				</div>

				<div className="flex items-center gap-2">
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
														border border-blue-500/20
														bg-blue-500/[0.10]
														text-blue-200
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
