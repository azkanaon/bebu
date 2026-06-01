"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, BookOpen, Inbox } from "lucide-react";

import {
	getMasterBooksAPI,
	getBookSubmissionsAPI,
	deleteBookAPI,
} from "@/lib/api";

import {
	BookResponse,
	BookQueryParams,
	BookSubmissionResponse,
	SubmissionQueryParams,
} from "@/types/book-management";

// --- IMPORT FILTER BAR BARU ---
import SubmissionFilterBar from "@/components/book-management/SubmissionFilterBar";
import BookCatalogFilterBar from "@/components/book-management/BookCatalogFilterBar";

// --- IMPORT COMPONENTS TABLE & MODALS ---
import SubmissionTable from "@/components/book-management/SubmissionTable";
import BookCatalogTable from "@/components/book-management/BookCatalogTable";
import SubmissionDetailModal from "@/components/book-management/SubmissionDetailModal";
import BookUpsertModal from "@/components/book-management/BookUpsertModal";
import SubmissionRejectModal from "@/components/book-management/SubmissionRejectModal";

export default function BookManagementPage() {
	// ==========================================
	// STATES: TABEL A - SUBMISSIONS USER
	// ==========================================
	const [submissions, setSubmissions] = useState<BookSubmissionResponse[]>(
		[],
	);
	const [loadingSubs, setLoadingSubs] = useState(true);
	const [totalSubsCount, setTotalSubsCount] = useState(0);
	const [totalSubsPages, setTotalSubsPages] = useState(1);
	const [subFilters, setSubFilters] = useState<SubmissionQueryParams>({
		search: "",
		status: "pending", // Default fokus ke ajuan baru yang perlu diproses
		page: 1,
		limit: 5,
	});

	// ==========================================
	// STATES: TABEL B - CATALOG MASTER BOOKS
	// ==========================================
	const [books, setBooks] = useState<BookResponse[]>([]);
	const [loadingBooks, setLoadingBooks] = useState(true);
	const [totalBooksCount, setTotalBooksCount] = useState(0);
	const [totalBooksPages, setTotalBooksPages] = useState(1);
	const [bookFilters, setBookFilters] = useState<BookQueryParams>({
		search: "",
		page: 1,
		limit: 5,
	});

	// ==========================================
	// STATES: MODALS CONTROLLER MANAGEMENT
	// ==========================================
	const [viewingSubmission, setViewingSubmission] =
		useState<BookSubmissionResponse | null>(null);

	const [upsertModalOpen, setUpsertModalOpen] = useState(false);
	const [selectedBookToEdit, setSelectedBookToEdit] =
		useState<BookResponse | null>(null);
	const [submissionToApprove, setSubmissionToApprove] =
		useState<BookSubmissionResponse | null>(null);

	const [submissionToReject, setSubmissionToReject] =
		useState<BookSubmissionResponse | null>(null);

	// ==========================================
	// LOGIC FETCHERS
	// ==========================================
	const fetchSubmissions = useCallback(async () => {
		setLoadingSubs(true);
		try {
			const response = await getBookSubmissionsAPI(subFilters);
			setSubmissions(response.data);
			setTotalSubsCount(response.total_rows);
			setTotalSubsPages(response.total_pages);
		} catch (err) {
			console.error("Failed to load book submissions", err);
		} finally {
			setLoadingSubs(false);
		}
	}, [subFilters]);

	const fetchMasterBooks = useCallback(async () => {
		setLoadingBooks(true);
		try {
			const response = await getMasterBooksAPI(bookFilters);
			setBooks(response.data);
			setTotalBooksCount(response.total_rows);
			setTotalBooksPages(response.total_pages);
		} catch (err) {
			console.error("Failed to load master books catalog", err);
		} finally {
			setLoadingBooks(false);
		}
	}, [bookFilters]);

	// Handle Perubahan Filter Independen
	const handleSubFilterChange = (
		key: keyof SubmissionQueryParams,
		value: any,
	) => {
		setSubFilters((prev) => ({
			...prev,
			[key]: value,
			page: key === "page" ? value : 1,
		}));
	};

	const handleBookFilterChange = (key: keyof BookQueryParams, value: any) => {
		setBookFilters((prev) => ({
			...prev,
			[key]: value,
			page: key === "page" ? value : 1,
		}));
	};

	// Trigger Reload Data dengan Debounce Ringan (300ms)
	useEffect(() => {
		const delayDebounce = setTimeout(() => {
			fetchSubmissions();
		}, 300);
		return () => clearTimeout(delayDebounce);
	}, [
		subFilters.search,
		subFilters.status,
		subFilters.page,
		fetchSubmissions,
	]);

	useEffect(() => {
		const delayDebounce = setTimeout(() => {
			fetchMasterBooks();
		}, 300);
		return () => clearTimeout(delayDebounce);
	}, [bookFilters.search, bookFilters.page, fetchMasterBooks]);

	return (
		<div className="relative min-h-screen overflow-hidden">
			{/* Ambient Glow Background */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute top-[-10%] right-[5%] h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-3xl" />
				<div className="absolute bottom-[20%] left-[-5%] h-[350px] w-[350px] rounded-full bg-purple-500/5 blur-3xl" />
			</div>

			<div className="relative z-10 space-y-6 py-6">
				{/* PAGE HEADER */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
							Platform Library & Knowledge Base
						</p>
						<h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
							Book Management
						</h1>
						<p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
							Verifikasi pengajuan literatur dari komunitas atau
							kelola repositori data buku master platform secara
							langsung.
						</p>
					</div>

					<button
						onClick={() => {
							setSelectedBookToEdit(null);
							setSubmissionToApprove(null);
							setUpsertModalOpen(true);
						}}
						className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
					>
						<Plus size={16} />
						Add Book Directly
					</button>
				</div>

				{/* SECTION TABEL A: USER BOOK SUBMISSIONS */}
				<div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl space-y-5">
					<div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
							<Inbox size={16} />
						</div>
						<div>
							<h2 className="text-lg font-bold text-white">
								User Book Submissions
							</h2>
							<p className="text-xs text-zinc-500">
								Daftar usulan buku baru yang diajukan oleh
								pengguna aplikasi
							</p>
						</div>
					</div>

					{/* 1. Filter Bar untuk Submission */}
					<SubmissionFilterBar
						filters={subFilters}
						onFilterChange={handleSubFilterChange}
					/>

					{/* 2. Tabel Data Submission */}
					<SubmissionTable
						data={submissions}
						loading={loadingSubs}
						filters={subFilters}
						onFilterChange={handleSubFilterChange}
						totalPages={totalSubsPages}
						totalItems={totalSubsCount}
						onViewDetail={(sub) => setViewingSubmission(sub)}
						onApprove={(sub) => {
							setSubmissionToApprove(sub);
							setSelectedBookToEdit(null);
							setUpsertModalOpen(true);
						}}
						onReject={(sub) => setSubmissionToReject(sub)}
					/>
				</div>

				{/* SECTION TABEL B: MASTER BOOKS DATABASE */}
				<div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl space-y-5">
					<div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
							<BookOpen size={16} />
						</div>
						<div>
							<h2 className="text-lg font-bold text-white">
								Master Catalog Books
							</h2>
							<p className="text-xs text-zinc-500">
								Database buku terverifikasi aktif yang tayang di
								sistem aplikasi
							</p>
						</div>
					</div>

					{/* 1. Filter Bar untuk Master Book Catalog */}
					<BookCatalogFilterBar
						filters={bookFilters}
						onFilterChange={handleBookFilterChange}
					/>

					{/* 2. Tabel Data Master Book Catalog */}
					<BookCatalogTable
						data={books}
						loading={loadingBooks}
						filters={bookFilters}
						onFilterChange={handleBookFilterChange}
						totalPages={totalBooksPages}
						totalItems={totalBooksCount}
						onEdit={(book) => {
							setSelectedBookToEdit(book);
							setSubmissionToApprove(null);
							setUpsertModalOpen(true);
						}}
						onDelete={async (id) => {
							try {
								await deleteBookAPI(id);
								fetchMasterBooks();
							} catch (err) {
								console.error(err);
							}
						}}
					/>
				</div>
			</div>

			{/* MODALS CONTROLLERS SYSTEM */}
			<SubmissionDetailModal
				isOpen={!!viewingSubmission}
				submission={viewingSubmission}
				onClose={() => setViewingSubmission(null)}
			/>

			<BookUpsertModal
				isOpen={upsertModalOpen}
				editData={selectedBookToEdit}
				approvalSourceData={submissionToApprove}
				onClose={() => setUpsertModalOpen(false)}
				onSuccess={() => {
					fetchMasterBooks();
					fetchSubmissions();
				}}
			/>

			<SubmissionRejectModal
				isOpen={!!submissionToReject}
				submission={submissionToReject}
				onClose={() => setSubmissionToReject(null)}
				onSuccess={fetchSubmissions}
				availableBooksCatalog={books}
			/>
		</div>
	);
}
