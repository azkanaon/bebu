"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Loader2, Inbox, Lock } from "lucide-react";
import {
	useInfiniteMySubmissions,
	useDeleteSubmission,
} from "@/api/submission/useSubmission";
import { useInView } from "react-intersection-observer";
import { MySubmissionItem } from "@/types/submission";
import { SubmissionCard } from "@/components/book-submission/SubmissionCard";
import ConfirmModal from "@/components/bookshelf/ConfirmModal";
import BookSubmissionModal from "@/components/book-submission/BookSubmissionModal";
import { useAuthStore } from "@/stores/useAuthStore"; // 🔥 Import auth store bawaan

export default function MySubmissionsPage() {
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [submissionToEdit, setSubmissionToEdit] =
		useState<MySubmissionItem | null>(null);
	const [submissionToDelete, setSubmissionToDelete] = useState<number | null>(
		null,
	);

	// 🔥 Ambil data user secara bersih dari Zustand store
	const { user } = useAuthStore();
	const isSuspended = user?.status === "suspended";

	const { ref, inView } = useInView();
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
		useInfiniteMySubmissions("pending");
	const { mutate: deleteSubmission, isPending: isDeleting } =
		useDeleteSubmission();

	const submissions = useMemo(() => {
		const allItems = data?.pages.flatMap((p) => p.data ?? []) || [];
		return allItems.filter(
			(item): item is MySubmissionItem => item !== null,
		);
	}, [data]);

	useEffect(() => {
		if (inView && hasNextPage) fetchNextPage();
	}, [inView, hasNextPage, fetchNextPage]);

	const handleOpenEdit = (item: MySubmissionItem) => {
		// Preventif: Jangan izinkan edit jika akun ditangguhkan
		if (isSuspended) return;
		setSubmissionToEdit(item);
		setIsAddModalOpen(true);
	};

	return (
		<div className="max-w-[600px] py-8 text-slate-200">
			{/* 1. HEADER DENGAN TOMBOL ADD */}
			<header className="mb-10 px-4 sm:px-0 flex items-center justify-between">
				<div>
					<h1 className="text-xl font-bold text-white">
						Book Submissions
					</h1>
					<p className="text-sm text-slate-500 mt-1">
						Manage your pending book requests
					</p>
				</div>

				{/* TOMBOL REQUEST DENGAN PROTEKSI STATUS */}
				<button
					disabled={isSuspended}
					onClick={() => {
						setSubmissionToEdit(null);
						setIsAddModalOpen(true);
					}}
					className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300
            ${
				isSuspended
					? "bg-red-950/30 border border-red-500/20 text-red-400/80 cursor-not-allowed shadow-none"
					: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer"
			}
          `}
				>
					{isSuspended ? (
						<>
							<Lock size={14} className="text-red-400" />
							<span>Suspended</span>
						</>
					) : (
						<>
							<Plus size={18} />
							<span className="hidden sm:block">
								Request Book
							</span>
						</>
					)}
				</button>
			</header>

			<main className="space-y-4 px-4 sm:px-0">
				{isLoading ? (
					<div className="py-20 flex justify-center">
						<Loader2 className="animate-spin text-blue-500" />
					</div>
				) : submissions.length > 0 ? (
					<>
						{submissions.map((item) => (
							<SubmissionCard
								key={item.id}
								item={item}
								// Jika disuspend, kita bisa sembunyikan atau matikan trigger aksinya
								onEdit={() => handleOpenEdit(item)}
								onDelete={() =>
									!isSuspended &&
									setSubmissionToDelete(item.id)
								}
							/>
						))}
						<div ref={ref} className="py-10 flex justify-center">
							{isFetchingNextPage && (
								<Loader2
									className="animate-spin text-blue-500"
									size={20}
								/>
							)}
						</div>
					</>
				) : (
					/* EMPTY STATE */
					<div className="py-32 flex flex-col items-center justify-center bg-[#0B1220]/40 border border-dashed border-white/5 rounded-[2.5rem] text-slate-600 text-center px-6">
						<Inbox size={48} className="mb-4 opacity-20" />
						<p className="text-sm font-medium">
							{isSuspended
								? "Submissions are locked due to account suspension."
								: "No pending requests found."}
						</p>

						{/* Sembunyikan atau modifikasi tombol trigger baru di dalam empty state */}
						{!isSuspended && (
							<button
								onClick={() => setIsAddModalOpen(true)}
								className="mt-4 text-blue-500 text-xs font-bold uppercase tracking-widest cursor-pointer hover:text-blue-400 transition-colors"
							>
								Start a new request
							</button>
						)}
					</div>
				)}
			</main>

			{/* MODAL KONFIRMASI HAPUS */}
			<ConfirmModal
				open={submissionToDelete !== null}
				onClose={() => setSubmissionToDelete(null)}
				onConfirm={() => {
					if (submissionToDelete) {
						deleteSubmission(submissionToDelete, {
							onSuccess: () => {
								setSubmissionToDelete(null);
							},
						});
					}
				}}
				title="Delete Request?"
				message="Are you sure you want to delete this book submission?"
				confirmText="Delete Now"
				isDestructive={true}
				isPending={isDeleting}
			/>

			{/* MODAL ADD/EDIT SUBMISSION */}
			<BookSubmissionModal
				open={isAddModalOpen}
				onClose={() => {
					setIsAddModalOpen(false);
					setSubmissionToEdit(null);
				}}
				editData={submissionToEdit}
			/>
		</div>
	);
}
