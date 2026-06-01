"use client";

import { useState, useEffect } from "react";
import { X, Trash2, ShieldAlert, Clock3 } from "lucide-react";
import { BookResponse } from "@/types/book-management";

interface BookDeleteModalProps {
	isOpen: boolean;
	book: BookResponse | null;
	onClose: () => void;
	onConfirm: (bookId: number) => Promise<void> | void;
}

export default function BookDeleteModal({
	isOpen,
	book,
	onClose,
	onConfirm,
}: BookDeleteModalProps) {
	const [submitting, setSubmitting] = useState(false);

	// Efek untuk mengunci scrolling halaman belakang
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}

		// Cleanup function untuk mengembalikan scroll jika komponen unmount secara tiba-tiba
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	if (!isOpen || !book) return null;

	const handleConfirmDelete = async () => {
		setSubmitting(true);
		try {
			await onConfirm(book.book_id);
			onClose();
		} catch (err) {
			console.error("Failed to execute data purge:", err);
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
					border border-red-500/20 bg-[#09090B]/95 backdrop-blur-2xl
					shadow-2xl shadow-black/80
					animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-4
					duration-300
				"
			>
				{/* Ambient Glow Effect - Heavy Destructive Red */}
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.08),transparent_50%)]" />

				{/* HEADER */}
				<div className="relative flex items-start justify-between border-b border-white/5 px-6 py-5">
					<div>
						<div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-red-400 font-bold">
							<ShieldAlert size={12} />
							Database Purge Authorization
						</div>
						<h2 className="mt-3 text-lg font-semibold text-white">
							Permanently Delete Record?
						</h2>
						<p className="mt-1 text-xs text-zinc-500">
							Action requires absolute administrative confirmation
						</p>
					</div>

					<button
						onClick={onClose}
						disabled={submitting}
						className="
							flex h-9 w-9 items-center justify-center rounded-2xl
							border border-white/10 bg-white/[0.03] text-zinc-500
							transition-all duration-200
							hover:border-white/20 hover:bg-white/[0.05] hover:text-white
							disabled:opacity-30
						"
					>
						<X size={15} />
					</button>
				</div>

				{/* CONTENT AREA */}
				<div className="p-6 space-y-4 text-xs">
					{/* WARNING CALLOUT */}
					<div className="rounded-2xl border border-red-500/10 bg-red-500/[0.02] p-4 flex gap-3 items-start">
						<Trash2
							size={16}
							className="text-red-400 shrink-0 mt-0.5"
						/>
						<div>
							<h5 className="text-xs font-semibold text-red-200">
								Irreversible Operation Warning
							</h5>
							<p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">
								You are about to purge the book meta-asset
								listed below. This will wipe all system
								references and catalog associations instantly.
							</p>
						</div>
					</div>

					{/* TARGET DETAIL CARD */}
					<div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-1">
						<span className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 block">
							Target Literature Asset
						</span>
						<h4 className="text-sm font-bold text-zinc-200 truncate">
							{book.title}
						</h4>
						<p className="text-[11px] text-zinc-500 font-mono">
							Catalog Registry ID: #{book.book_id}
						</p>
					</div>
				</div>

				{/* FOOTER */}
				<div className="flex items-center justify-between border-t border-white/5 bg-black/20 px-6 py-4">
					<div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
						<Clock3 size={12} className="text-red-400/60" />
						Syncing drop tables...
					</div>

					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={onClose}
							disabled={submitting}
							className="
								h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 
								text-xs font-medium text-zinc-300 transition-all duration-200 
								hover:border-white/20 hover:text-white disabled:opacity-30
							"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleConfirmDelete}
							disabled={submitting}
							className="
								h-9 rounded-xl bg-red-500 px-4 text-xs font-bold 
								text-zinc-950 transition-all duration-200 
								hover:bg-red-400 disabled:pointer-events-none disabled:opacity-40
							"
						>
							{submitting ? "Purging..." : "Confirm Purge"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
