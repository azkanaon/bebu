"use client";

import { useState, useEffect } from "react";

import { getReportSummariesAPIs } from "@/lib/api";
import { ReportSummaryResponse, ReportQueryParams } from "@/types/report";

import FilterBar from "@/components/report/FilterBar";
import ReportTable from "@/components/report/ReportTable";
import ReportDetailModal from "@/components/report/ReportDetailModal";

export default function ReportManagementPage() {
	const [reports, setReports] = useState<ReportSummaryResponse[]>([]);
	const [loading, setLoading] = useState(true);

	const [selectedSummaryID, setSelectedSummaryID] = useState<number | null>(
		null,
	);

	const [totalCount, setTotalCount] = useState<number>(0);
	const [totalPages, setTotalPages] = useState<number>(1);

	const [filters, setFilters] = useState<ReportQueryParams>({
		search: "",
		status: "Not reviewed",
		type: "",
		page: 1,
		limit: 10,
	});

	const handleFilterChange = (
		key: keyof ReportQueryParams,
		value: string | number,
	) => {
		setFilters((prev) => ({
			...prev,
			[key]: value,
			page: key === "page" ? (value as number) : 1,
		}));
	};

	const fetchReports = async () => {
		setLoading(true);

		try {
			const response = await getReportSummariesAPIs(filters);

			setReports(response.data);
			setTotalCount(response.total_count);
			setTotalPages(response.total_pages);
		} catch (err) {
			console.error("Failed to load admin report dashboard", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		const delayDebounce = setTimeout(() => {
			fetchReports();
		}, 300);

		return () => clearTimeout(delayDebounce);
	}, [filters.search, filters.status, filters.type, filters.page]);

	return (
		<div className="relative min-h-screen overflow-hidden">
			{/* Ambient Background */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute top-[-120px] left-[15%] h-[320px] w-[320px] rounded-full bg-blue-500/10 blur-3xl" />
				<div className="absolute bottom-[-150px] right-[10%] h-[280px] w-[280px] rounded-full bg-indigo-500/10 blur-3xl" />
			</div>

			<div className="relative z-10 space-y-6 py-6">
				{/* HEADER */}
				<div className="flex items-start justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.3em] text-blue-400/70">
							Moderation Console
						</p>

						<h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
							Trust & Safety Center
						</h1>

						<p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
							Monitor community reports, intellectual
							infringements, and platform integrity across the
							ecosystem.
						</p>
					</div>
				</div>

				{/* MAIN CONTENT */}
				<div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
					<div className="space-y-5">
						<FilterBar
							filters={filters}
							onFilterChange={handleFilterChange}
						/>

						<ReportTable
							data={reports}
							loading={loading}
							onSelect={(id) => setSelectedSummaryID(id)}
							currentPage={filters.page}
							totalPages={totalPages}
							totalItems={totalCount}
							onPageChange={(newPage) =>
								handleFilterChange("page", newPage)
							}
						/>
					</div>
				</div>

				<ReportDetailModal
					summaryID={selectedSummaryID}
					onClose={() => setSelectedSummaryID(null)}
					onActionSuccess={fetchReports}
				/>
			</div>
		</div>
	);
}

function MetricCard({
	title,
	value,
	icon,
}: {
	title: string;
	value: string | number;
	icon: React.ReactNode;
}) {
	return (
		<div
			className="
				group relative overflow-hidden rounded-2xl
				border border-white/10
				bg-white/[0.04]
				p-5
				backdrop-blur-xl
				transition-all duration-300
				hover:border-blue-400/20
				hover:bg-white/[0.06]
			"
		>
			<div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

			<div className="relative flex items-start justify-between">
				<div>
					<p className="text-sm text-zinc-400">{title}</p>

					<h3 className="mt-3 text-3xl font-bold text-white">
						{value}
					</h3>
				</div>

				<div className="rounded-xl bg-blue-500/10 p-2 text-blue-300">
					{icon}
				</div>
			</div>
		</div>
	);
}
