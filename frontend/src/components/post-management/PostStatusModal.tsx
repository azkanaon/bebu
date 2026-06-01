"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import {
	X,
	FileText,
	Globe,
	Trash2,
	ShieldAlert,
	Clock3,
	ExternalLink,
} from "lucide-react";

import { updatePostStatusAPI } from "@/lib/api";

interface PostStatusModalProps {
	post: {
		post_id: number;
		public_id: string;
		book_title: string;
		username: string;
		publish_status: "published" | "soft_deleted" | string;
		created_at?: string;
	} | null;
	onClose: () => void;
	onActionSuccess?: () => void;
}

interface ActionOption {
	value: "published" | "soft_delete" | "hard_delete";
	label: string;
	description: string;
	icon: any;
	tone: "neutral" | "warning" | "danger";
}

export default function PostStatusModal({
	post,
	onClose,
	onActionSuccess,
}: PostStatusModalProps) {
	// State menampung pilihan tindakan yang akan dieksekusi
	const [selectedAction, setSelectedAction] = useState<
		"published" | "soft_delete" | "hard_delete" | ""
	>("");
	const [submitting, setSubmitting] = useState(false);

	// Logika penguncian: Jika status awal postingan sudah "soft_deleted"
	const isCurrentlySoftDeleted = post?.publish_status === "soft_deleted";

	useEffect(() => {
		if (!post) return;

		// Set nilai default di radio/opsi berdasarkan status backend saat modal terbuka
		if (post.publish_status === "published") {
			setSelectedAction("published");
		} else {
			// Jika statusnya "soft_deleted", kosongkan pilihan agar admin memilih tindakan selanjutnya secara eksplisit
			setSelectedAction("");
		}
	}, [post]);

	const handleUpdateStatus = async () => {
		if (!selectedAction || !post) return;

		// Validasi Tambahan: Mencegah perubahan dari soft_deleted kembali ke published
		if (isCurrentlySoftDeleted && selectedAction === "published") {
			alert(
				"Cannot restore a soft-deleted post back to published status.",
			);
			return;
		}

		setSubmitting(true);
		try {
			// Memanggil API bawaan: updatePostStatusAPI(postID, status)
			// Mengirim value sesuai pilihan: "published", "soft_delete", atau "hard_delete"
			const response = await updatePostStatusAPI(
				post.post_id,
				selectedAction,
			);

			alert(response.message || "Post status updated successfully.");
			onActionSuccess?.();
			onClose();
		} catch (err: any) {
			alert(
				err?.response?.data?.error ||
					err?.message ||
					"Failed to update post status.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	if (!post) return null;

	// Menyediakan 3 opsi tindakan manajemen postingan sesuai kebutuhan Anda
	const actionOptions: ActionOption[] = [
		{
			value: "published",
			label: "Approve & Publish Content",
			description:
				"Make this post active and visible to the public timeline and global feeds.",
			icon: Globe,
			tone: "neutral",
		},
		{
			value: "soft_delete",
			label: "Soft Delete Post",
			description:
				"Hide this post from all public access. The content remains archived in the database.",
			icon: Trash2,
			tone: "warning",
		},
		{
			value: "hard_delete",
			label: "Hard Delete (Permanent)",
			description:
				"Permanently purge this post from the database. This action is irreversible.",
			icon: ShieldAlert,
			tone: "danger",
		},
	];

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
					relative w-full max-w-xl overflow-hidden rounded-3xl
					border border-white/10 bg-[#09090B]/95 backdrop-blur-2xl
					shadow-2xl shadow-black/50
					animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-4
					duration-300
				"
			>
				{/* Ambient Glow Effect */}
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.06),transparent_40%)]" />

				{/* HEADER */}
				<div className="relative flex items-start justify-between border-b border-white/5 px-6 py-5">
					<div>
						<div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-blue-300/80">
							<FileText size={12} />
							Content Management
						</div>
						<h2 className="mt-3 text-lg font-semibold text-white">
							Publication Status Control
						</h2>
						<p className="mt-1 text-xs text-zinc-500">
							Target Book Review: &quot;
							{post.book_title || "Untitled"}
							&quot; by @{post.username}
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

				{/* CONTENT */}
				<div className="p-6 space-y-6">
					{/* Warning Alert khusus jika postingan berstatus Soft Deleted */}
					{isCurrentlySoftDeleted && (
						<div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4 flex gap-3 items-start">
							<Trash2
								size={16}
								className="text-amber-400 shrink-0 mt-0.5"
							/>
							<div>
								<h5 className="text-xs font-semibold text-amber-200">
									Publication Soft-Deleted
								</h5>
								<p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">
									This post has been soft-deleted. Restoring
									it back to &quot;Published&quot; is locked,
									but you can still choose to purge it
									permanently (Hard Delete).
								</p>
							</div>
						</div>
					)}

					{/* CURRENT STATUS DETAILS CARD */}
					<div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between">
						{/* CONTAINER UTAMA: Menggunakan conditional rendering berdasarkan status soft_deleted */}
						{post.publish_status === "soft_deleted" ? (
							/* Tampilan Statis (Disabled) jika postingan sudah di-Soft Delete */
							<div className="flex items-center gap-3 p-1.5 -m-1.5 opacity-60 select-none">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/[0.10] text-amber-400">
									<FileText size={18} />
								</div>
								<div>
									<h3 className="truncate max-w-[260px] text-sm font-semibold text-zinc-400 line-through">
										{post.book_title || "Untitled Review"}
									</h3>
									<p className="text-[11px] text-zinc-500">
										Author: @{post.username} · ID #
										{post.post_id}
									</p>
								</div>
							</div>
						) : (
							/* Tampilan Tautan Aktif (Clickable) jika status postingan aktif / published */
							<a
								href={`/post/${post.public_id}`}
								target="_blank"
								rel="noopener noreferrer"
								className="
				group/post flex items-center gap-3 rounded-2xl p-1.5 -m-1.5
				transition-all duration-200 
				hover:bg-white/[0.04] hover:ring-1 hover:ring-white/10
				cursor-pointer
			"
							>
								<div
									className="
				flex h-10 w-10 items-center justify-center rounded-xl 
				bg-blue-500/[0.10] text-blue-300
				transition-colors duration-200
				group-hover/post:bg-blue-500/[0.20] group-hover/post:text-blue-200
			"
								>
									<FileText size={18} />
								</div>
								<div>
									<h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
										<span className="truncate max-w-[240px]">
											{post.book_title ||
												"Untitled Review"}
										</span>
										{/* Ikon indikator link eksternal */}
										<ExternalLink
											size={12}
											className="text-zinc-500 transition-colors duration-200 group-hover/post:text-blue-400 shrink-0"
										/>
									</h3>
									<p className="text-[11px] text-zinc-500 transition-colors duration-200 group-hover/post:text-zinc-400">
										Author: @{post.username} · ID #
										{post.post_id}
									</p>
								</div>
							</a>
						)}

						{/* BADGE STATUS */}
						<div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/5 px-2.5 py-1 text-[11px] shrink-0">
							<span className="text-zinc-500">Status:</span>
							<span
								className={clsx(
									"font-medium uppercase tracking-wider text-[10px]",
									post.publish_status === "published" &&
										"text-emerald-400",
									post.publish_status === "soft_deleted" &&
										"text-amber-400",
								)}
							>
								{post.publish_status?.replace("_", " ")}
							</span>
						</div>
					</div>

					{/* STATUS OPTIONS */}
					<div className="space-y-3">
						<div>
							<p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
								Select State Override
							</p>
							<h4 className="mt-1 text-xs text-zinc-400">
								Choose a new database publication status state
								for this review
							</h4>
						</div>

						<div className="grid gap-3">
							{actionOptions.map((action) => {
								const Icon = action.icon;
								const isActive =
									selectedAction === action.value;

								// Aturan Nonaktif Opsi:
								// 1. Opsi "published" di-disabled jika status aslinya sudah soft_deleted
								// 2. Opsi "soft_delete" di-disabled jika status aslinya sudah soft_deleted
								const isOptionDisabled =
									isCurrentlySoftDeleted &&
									(action.value === "published" ||
										action.value === "soft_delete");

								return (
									<button
										key={action.value}
										type="button"
										disabled={isOptionDisabled}
										onClick={() =>
											setSelectedAction(action.value)
										}
										className={clsx(
											"group relative overflow-hidden rounded-[22px] border p-4 text-left transition-all duration-200",
											isActive
												? "border-blue-500/30 bg-blue-500/[0.08]"
												: "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
											isOptionDisabled &&
												"opacity-30 cursor-not-allowed",
										)}
									>
										<div className="flex items-center gap-4">
											<div
												className={clsx(
													"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
													action.tone === "danger" &&
														"bg-red-500/[0.10] text-red-300",
													action.tone === "warning" &&
														"bg-amber-500/[0.10] text-amber-300",
													action.tone === "neutral" &&
														"bg-emerald-500/[0.10] text-emerald-300",
												)}
											>
												<Icon size={16} />
											</div>
											<div className="flex-1">
												<h5 className="text-xs font-semibold text-white">
													{action.label}
												</h5>
												<p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
													{action.description}
												</p>
											</div>
											<div
												className={clsx(
													"h-4 w-4 rounded-full border flex items-center justify-center transition-all",
													isActive
														? "border-blue-500 bg-blue-500"
														: "border-white/20",
												)}
											>
												{isActive && (
													<div className="h-1.5 w-1.5 rounded-full bg-white" />
												)}
											</div>
										</div>
									</button>
								);
							})}
						</div>
					</div>
				</div>

				{/* FOOTER */}
				<div className="flex items-center justify-between border-t border-white/5 bg-black/20 px-6 py-4">
					<div className="flex items-center gap-2 text-[10px] text-zinc-500">
						<Clock3 size={12} className="text-blue-400/70" />
						Changes impact system architecture immediately
					</div>

					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={onClose}
							className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-xs font-medium text-zinc-300 transition-all duration-200 hover:border-white/20 hover:text-white"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleUpdateStatus}
							disabled={
								submitting ||
								!selectedAction ||
								(post.publish_status === "published" &&
									selectedAction === "published")
							}
							className="h-9 rounded-xl bg-blue-500 px-4 text-xs font-semibold text-white transition-all duration-200 hover:bg-blue-400 disabled:pointer-events-none disabled:opacity-40"
						>
							{submitting ? "Processing..." : "Update Status"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
