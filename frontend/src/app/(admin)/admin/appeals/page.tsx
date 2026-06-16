"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

import { getAdminAppealsAPI } from "@/lib/api";
import { AdminAppealList } from "@/types/appeal";

import AppealFilterBar from "@/components/appeal-management/AppealFilterBar";
import AppealTable from "@/components/appeal-management/AppealTable";
import AppealActionModal from "@/components/appeal-management/AppealActionModal";

export default function AppealManagementPage() {
	const [appeals, setAppeals] = useState<AdminAppealList[]>([]);
	const [filteredAppeals, setFilteredAppeals] = useState<AdminAppealList[]>(
		[],
	);
	const [loading, setLoading] = useState(true);

	// State penampung ID banding terpilih untuk memicu modal pop-up
	const [selectedAppealID, setSelectedAppealID] = useState<number | null>(
		null,
	);

	// Filter Local State Grouping
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState(""); // "", "Pending", "Approved", "Rejected"

	// State Tambahan untuk Pagination (Client-side)
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	const fetchAppeals = useCallback(async () => {
		setLoading(true);
		try {
			const response = await getAdminAppealsAPI();

			const validData =
				response && Array.isArray(response.data) ? response.data : [];

			setAppeals(validData);
			setFilteredAppeals(validData);
			setCurrentPage(1); // Reset ke halaman 1 saat refresh data awal
		} catch (err) {
			console.error("Failed to load admin account appeal dashboard", err);
			setAppeals([]);
			setFilteredAppeals([]);
		} finally {
			setLoading(false);
		}
	}, []);

	// Efek samping memuat data awal saat halaman pertama kali dibuka
	useEffect(() => {
		fetchAppeals();
	}, [fetchAppeals]);

	// Client-side filtering & debouncing
	useEffect(() => {
		const delayDebounce = setTimeout(() => {
			if (!appeals || !Array.isArray(appeals)) {
				setFilteredAppeals([]);
				return;
			}

			let result = [...appeals];

			if (statusFilter) {
				result = result.filter((a) => a.status === statusFilter);
			}

			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase();
				result = result.filter(
					(a) =>
						(a.username &&
							a.username.toLowerCase().includes(query)) ||
						(a.displayName &&
							a.displayName.toLowerCase().includes(query)),
				);
			}

			setFilteredAppeals(result);
			setCurrentPage(1); // Setiap kali filter berubah, kembalikan posisi halaman ke angka 1
		}, 200);

		return () => clearTimeout(delayDebounce);
	}, [searchQuery, statusFilter, appeals]);

	// ==================== LOGIKA CLIENT-SIDE PAGINATION ====================
	// 1. Hitung total halaman berdasarkan data yang sudah ter-filter
	const totalPages = useMemo(() => {
		return Math.max(Math.ceil(filteredAppeals.length / itemsPerPage), 1);
	}, [filteredAppeals]);

	// 2. Iris data (Slice) sesuai dengan posisi halaman yang sedang aktif saat ini
	const paginatedAppeals = useMemo(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		return filteredAppeals.slice(startIndex, startIndex + itemsPerPage);
	}, [filteredAppeals, currentPage]);
	// =======================================================================

	return (
		<div className="relative min-h-screen overflow-hidden">
			{/* Ambient Orange Background Glow */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute top-[-120px] right-[15%] h-[320px] w-[320px] rounded-full bg-orange-500/10 blur-3xl" />
				<div className="absolute bottom-[-150px] left-[10%] h-[280px] w-[280px] rounded-full bg-amber-600/10 blur-3xl" />
			</div>

			<div className="relative z-10 space-y-6 py-6">
				{/* HEADER */}
				<div className="flex items-start justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.3em] text-orange-400/70 font-semibold">
							Trust & Safety Enforcement
						</p>

						<h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
							Account Appeals & Reviews
						</h1>

						<p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
							Evaluate suspension liftoff requests, review
							user-submitted defense defenses, analyze
							cross-uploaded image evidence, and restore or
							maintain restriction statuses.
						</p>
					</div>
				</div>

				{/* CONTENT BLOCK CONTAINER */}
				<div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
					<div className="space-y-5">
						{/* Filter bar */}
						<AppealFilterBar
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
							statusFilter={statusFilter}
							onStatusFilterChange={setStatusFilter}
						/>

						{/* Data table dengan parameter props pagination baru */}
						<AppealTable
							data={paginatedAppeals} // Pakai data yang sudah dipotong per-halaman
							loading={loading}
							onSelectReview={(id) => setSelectedAppealID(id)}
							currentPage={currentPage}
							totalPages={totalPages}
							totalItems={filteredAppeals.length} // Berikan total data setelah difilter
							onPageChange={(newPage) => setCurrentPage(newPage)}
						/>
					</div>
				</div>

				{/* ALL-IN-ONE POPUP MODAL TINJAUAN */}
				<AppealActionModal
					appealID={selectedAppealID}
					onClose={() => setSelectedAppealID(null)}
					onActionSuccess={() => {
						setSelectedAppealID(null);
						fetchAppeals();
					}}
				/>
			</div>
		</div>
	);
}
