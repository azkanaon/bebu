"use client";

import { useEffect } from "react";
import clsx from "clsx";
import {
	X,
	Inbox,
	User,
	Bookmark,
	Hash,
	Languages,
	FileText,
	MessageSquare,
	Sparkles,
} from "lucide-react";
import { BookSubmissionResponse } from "@/types/book-management";
import BookCover from "@/components/BookCover";

interface SubmissionDetailModalProps {
	isOpen: boolean;
	submission: BookSubmissionResponse | null;
	onClose: () => void;
}

export default function SubmissionDetailModal({
	isOpen,
	submission,
	onClose,
}: SubmissionDetailModalProps) {
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

	return (
		<div
			className="
				fixed inset-0 z-50
				flex items-center justify-center
				bg-black/70 p-4 backdrop-blur-md
				animate-in fade-in-0
				overflow-y-auto
			"
		>
			<div
				className="
					relative w-full max-w-2xl my-auto overflow-hidden rounded-3xl
					border border-white/10 bg-[#09090B]/95 backdrop-blur-2xl
					shadow-2xl shadow-black/50
					animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-4
					duration-300
					max-h-[90vh] flex flex-col
				"
			>
				{/* Ambient Glow Effect - Purple Topic Theme */}
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.06),transparent_45%)]" />

				{/* HEADER */}
				<div className="relative flex items-start justify-between border-b border-white/5 px-6 py-5 shrink-0">
					<div>
						<div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-purple-400">
							<Inbox size={12} />
							Submission Pipeline Intelligence
						</div>
						<h2 className="mt-3 text-lg font-semibold text-white">
							Proposal Document Details
						</h2>
						<p className="mt-1 text-xs text-zinc-500 flex items-center gap-1.5">
							<User size={12} className="text-zinc-600" />
							Submitted by:{" "}
							<span className="text-zinc-300 font-medium">
								@{submission.submitted_by}
							</span>{" "}
							(ID: #{submission.book_submission_id})
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

				{/* CONTENT AREA (SCROLLABLE) */}
				<div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
					{/* TOP INFO BLOCK: COVER & PRIMARY META */}
					<div className="flex flex-col sm:flex-row gap-5 items-start bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
						{/* COVER CANVAS */}
						<div className="w-full sm:w-auto flex justify-center shrink-0 mx-auto sm:mx-0">
							<BookCover
								src={submission.cover_img_url}
								title={submission.title}
								width={112} // setara w-28
								height={149} // proporsi rasio 3:4 dari lebar 112px
								className="
    w-28 
    aspect-[3/4] 
    rounded-xl 
    border border-white/10 
    shadow-xl 
    shadow-black/40
  "
							/>
						</div>

						{/* CORE META LABELS */}
						<div className="flex-1 space-y-3.5 w-full">
							<div>
								<span className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 flex items-center gap-1">
									<Bookmark
										size={10}
										className="text-purple-500/70"
									/>{" "}
									Document Title
								</span>
								<h3 className="text-base font-bold text-white mt-1 leading-snug">
									{submission.title}
								</h3>
							</div>

							<div>
								<span className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 flex items-center gap-1">
									<User size={10} className="text-zinc-500" />{" "}
									Proposed Authors
								</span>
								<p className="text-xs text-zinc-300 mt-0.5 font-medium">
									{submission.authors.join(", ") ||
										"Unspecified Author"}
								</p>
							</div>

							{/* INNER DATA PILLS GRID */}
							<div className="grid grid-cols-2 gap-3 pt-1">
								<div className="rounded-xl border border-white/5 bg-black/20 p-2.5">
									<span className="block text-[9px] uppercase tracking-wider font-bold text-zinc-500 flex items-center gap-1">
										<Hash
											size={10}
											className="text-zinc-500"
										/>{" "}
										ISBN Registry
									</span>
									<span className="text-xs text-zinc-300 font-mono mt-0.5 block">
										{submission.isbn || "N/A"}
									</span>
								</div>
								<div className="rounded-xl border border-white/5 bg-black/20 p-2.5">
									<span className="block text-[9px] uppercase tracking-wider font-bold text-zinc-500 flex items-center gap-1">
										<Languages
											size={10}
											className="text-zinc-500"
										/>{" "}
										Structure
									</span>
									<span className="text-xs text-zinc-300 mt-0.5 block">
										{submission.total_pages || "0"} pgs •{" "}
										<span className="uppercase text-[10px] bg-white/5 px-1 rounded text-zinc-400 font-mono font-bold">
											{submission.language || "??"}
										</span>
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* SYNOPSIS NARRATIVE CARD */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 font-bold flex items-center gap-1.5">
							<FileText size={12} className="text-zinc-500" />
							Synopsis Narrative
						</label>
						<p className="text-xs text-zinc-400 bg-white/[0.02] p-4 rounded-2xl border border-white/5 whitespace-pre-line leading-relaxed shadow-inner">
							{submission.synopsis ||
								"No synopses data was declared inside this proposal record."}
						</p>
					</div>

					{/* USER SUBMISSION STATEMENT NOTE */}
					<div className="space-y-1.5">
						<label className="text-[10px] uppercase tracking-[0.12em] text-purple-400 font-bold flex items-center gap-1.5">
							<MessageSquare
								size={12}
								className="text-purple-400/80"
							/>
							User Justification Note
						</label>
						<div className="relative overflow-hidden rounded-2xl border border-purple-500/10 bg-purple-500/[0.03] p-4">
							<p className="text-xs text-purple-200/90 italic leading-relaxed relative z-10">
								&ldquo;
								{submission.user_note ||
									"The operator left no additional explanatory notes for this proposal asset."}
								&rdquo;
							</p>
						</div>
					</div>
				</div>

				{/* FOOTER */}
				<div className="flex items-center justify-between border-t border-white/5 bg-black/20 px-6 py-4 shrink-0">
					<div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
						<Sparkles size={12} className="text-purple-400/70" />
						Status Badge:
						<span
							className={clsx(
								"font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 rounded-full border",
								submission.status === "pending" &&
									"bg-amber-500/5 border-amber-500/20 text-amber-400",
								submission.status === "approved" &&
									"bg-emerald-500/5 border-emerald-500/20 text-emerald-400",
								submission.status === "rejected" &&
									"bg-rose-500/5 border-rose-500/20 text-rose-400",
							)}
						>
							{submission.status}
						</span>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="
							h-9 rounded-xl border border-white/10 bg-white/[0.03] px-5 
							text-xs font-semibold text-zinc-300 transition-all duration-200 
							hover:border-white/20 hover:text-white
						"
					>
						Close Document View
					</button>
				</div>
			</div>
		</div>
	);
}
