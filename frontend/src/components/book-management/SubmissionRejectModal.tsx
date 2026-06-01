"use client";

import { useState, useEffect } from "react";
import {
	X,
	ShieldAlert,
	FileWarning,
	Copy,
	Clock3,
	MessageSquare,
} from "lucide-react";
import { BookSubmissionResponse, BookResponse } from "@/types/book-management";
import { rejectSubmissionAPI } from "@/lib/api";

interface SubmissionRejectModalProps {
	isOpen: boolean;
	submission: BookSubmissionResponse | null;
	onClose: () => void;
	onSuccess: () => void;
	availableBooksCatalog: BookResponse[];
}

export default function SubmissionRejectModal({
	isOpen,
	submission,
	onClose,
	onSuccess,
	availableBooksCatalog,
}: SubmissionRejectModalProps) {
	const [reasonCategory, setReasonCategory] = useState("incomplete"); // 'incomplete', 'duplicate', 'spam'
	const [note, setNote] = useState("");
	const [selectedDuplicateBookId, setSelectedDuplicateBookId] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	if (!isOpen || !submission) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);

		let finalAdminNote = `[Category: ${reasonCategory.toUpperCase()}] ${note}`;
		if (reasonCategory === "duplicate" && selectedDuplicateBookId) {
			const existingBook = availableBooksCatalog.find(
				(b) => b.book_id === Number(selectedDuplicateBookId),
			);
			if (existingBook) {
				finalAdminNote += ` -> (Duplicate of Master Book ID: ${existingBook.book_id} - "${existingBook.title}")`;
			}
		}

		try {
			await rejectSubmissionAPI(submission.book_submission_id, {
				admin_note: finalAdminNote,
			});
			onSuccess();
			onClose();
		} catch (err) {
			console.error("Failed to reject user submission", err);
			alert("Error filing rejection report.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div
			className="
				fixed inset-0 z-50
				flex items-center justify-center
				bg-black/70 p-4 backdrop-blur-md
				animate-in fade-in-0
			"
		>
			<div
				className="
					relative w-full max-w-md overflow-hidden rounded-3xl
					border border-white/10 bg-[#09090B]/95 backdrop-blur-2xl
					shadow-2xl shadow-black/50
					animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-4
					duration-300
				"
			>
				{/* Ambient Glow Effect - Danger Tone */}
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.07),transparent_45%)]" />

				{/* HEADER */}
				<div className="relative flex items-start justify-between border-b border-white/5 px-6 py-5">
					<div>
						<div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-rose-400">
							<ShieldAlert size={12} />
							Moderation Desk Pipeline
						</div>
						<h2 className="mt-3 text-lg font-semibold text-white">
							Reject User Submission
						</h2>
						<p className="mt-1 text-xs text-zinc-500 truncate max-w-[280px]">
							Declining target: &ldquo;{submission.title}&rdquo;
						</p>
					</div>

					<button
						onClick={onClose}
						className="
							flex h-9 w-9 items-center justify-center rounded-2xl
							border border-white/10 bg-white/[0.03] text-zinc-500
							transition-all duration-200
							hover:border-white/20 hover:bg-white/[0.05] hover:text-white
						"
					>
						<X size={15} />
					</button>
				</div>

				{/* CONTENT FORM */}
				<form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
					{/* REJECTION CATEGORY */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-[0.12em] text-zinc-400 font-semibold flex items-center gap-1.5">
							<FileWarning
								size={12}
								className="text-rose-400/80"
							/>
							Rejection Category Classification *
						</label>
						<div className="relative">
							<select
								value={reasonCategory}
								onChange={(e) => {
									setReasonCategory(e.target.value);
									if (e.target.value !== "duplicate")
										setSelectedDuplicateBookId("");
								}}
								className="
									w-full appearance-none rounded-2xl border border-white/10 
									bg-white/[0.02] px-3.5 py-2.5 text-zinc-200 outline-none 
									transition-all duration-300 focus:border-rose-500/40 focus:bg-rose-500/[0.01]
								"
							>
								<option
									value="incomplete"
									className="bg-[#09090B] text-zinc-300"
								>
									Informasi Buku Kurang Lengkap
								</option>
								<option
									value="duplicate"
									className="bg-[#09090B] text-zinc-300"
								>
									Buku Sudah Tersedia di Database (Duplicate)
								</option>
								<option
									value="spam"
									className="bg-[#09090B] text-zinc-300"
								>
									Konten Tidak Sesuai Kriteria / Spam
								</option>
							</select>
							<div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-zinc-500">
								<svg
									className="h-4 w-4 fill-current"
									viewBox="0 0 20 20"
								>
									<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
								</svg>
							</div>
						</div>
					</div>

					{/* DYNAMIC VIEW: MASTER DUPLICATE SELECTION CARD */}
					{reasonCategory === "duplicate" && (
						<div className="p-4 bg-amber-500/[0.02] rounded-2xl border border-amber-500/20 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
							<label className="text-[10px] uppercase tracking-[0.12em] text-amber-400 font-bold flex items-center gap-1.5">
								<Copy size={12} />
								Link with Master Database Book *
							</label>
							<div className="relative">
								<select
									required
									value={selectedDuplicateBookId}
									onChange={(e) =>
										setSelectedDuplicateBookId(
											e.target.value,
										)
									}
									className="
										w-full appearance-none rounded-xl border border-white/5 
										bg-black/40 px-3 py-2 text-zinc-300 outline-none 
										focus:border-amber-500/30
									"
								>
									<option
										value=""
										className="bg-[#09090B] text-zinc-500"
									>
										-- Select Matching Master Record --
									</option>
									{availableBooksCatalog.map((b) => (
										<option
											key={b.book_id}
											value={b.book_id}
											className="bg-[#09090B] text-zinc-300"
										>
											ID #{b.book_id} - {b.title} (
											{b.authors.join(", ")})
										</option>
									))}
								</select>
								<div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-600">
									<svg
										className="h-3 w-3 fill-current"
										viewBox="0 0 20 20"
									>
										<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
									</svg>
								</div>
							</div>
						</div>
					)}

					{/* ADMIN REASON NOTE TEXTAREA */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-[0.12em] text-zinc-400 font-semibold flex items-center gap-1.5">
							<MessageSquare
								size={12}
								className="text-zinc-500"
							/>
							Feedback Note for Submitter *
						</label>
						<textarea
							required
							rows={3}
							placeholder="Provide explicit reasons or requested modifications to inform the user..."
							value={note}
							onChange={(e) => setNote(e.target.value)}
							className="
								w-full rounded-2xl border border-white/10 bg-white/[0.02] 
								px-3.5 py-2.5 text-zinc-200 outline-none resize-none transition-all duration-300 
								focus:border-rose-500/40 focus:bg-rose-500/[0.01]
							"
						/>
					</div>

					{/* FOOTER */}
					<div className="flex items-center justify-between border-t border-white/5 bg-black/20 px-6 py-4 -mx-6 -mb-6 mt-6">
						<div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
							<Clock3 size={12} className="text-rose-500/60" />
							Disapproval alert will be dispatched
						</div>

						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={onClose}
								className="
									h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 
									text-xs font-medium text-zinc-300 transition-all duration-200 
									hover:border-white/20 hover:text-white
								"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={
									submitting ||
									(reasonCategory === "duplicate" &&
										!selectedDuplicateBookId)
								}
								className="
									h-9 rounded-xl bg-rose-500 px-4 text-xs font-bold 
									text-zinc-950 transition-all duration-200 
									hover:bg-rose-400 disabled:pointer-events-none disabled:opacity-30
								"
							>
								{submitting
									? "Processing..."
									: "Reject Proposal"}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
