"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	MoreVertical,
	Flag,
	EyeOff,
	Link,
	UserX,
	Trash2,
	AlertTriangle,
} from "lucide-react";
import ReportModal from "./ReportModal";
import { deletePostAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface PostMenuProps {
	postId: number;
	postPublicID: string;
	userPublicID: string;
}

export default function PostMenu({ postId, postPublicID, userPublicID }: PostMenuProps) {
	const [open, setOpen] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	
	const [isReportOpen, setIsReportOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (!ref.current?.contains(e.target as Node)) {
				setOpen(false);
				setShowDeleteConfirm(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Di dalam AnalysisPost.tsx
	const authStorage =
		typeof window !== "undefined"
			? localStorage.getItem("bebu-auth-storage")
			: null;
	const parsedStorage = authStorage ? JSON.parse(authStorage) : null;
	const currentUserId = parsedStorage?.state?.user?.data?.user_public_id;

	// Cek apakah user yang login adalah pemilik postingan
	const isOwner = String(userPublicID) === String(currentUserId);

	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		try {
			setIsDeleting(true);

			// Panggil API
			await deletePostAPI(postPublicID);

			// Tutup semua state dropdown/konfirmasi
			setOpen(false);
			setShowDeleteConfirm(false);

			window.location.reload();
		} catch (error: unknown) {
			console.error("Delete error:", error);
			toast.error("Failed to delete post");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="relative" ref={ref}>
			{/* Trigger */}
			<button
				onClick={() => setOpen(!open)}
				className="p-2 rounded-full hover:bg-gray-800 transition"
			>
				<MoreVertical size={20} />
			</button>

			{/* Dropdown */}
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: 8, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 8, scale: 0.95 }}
						transition={{ duration: 0.15 }}
						className="
                absolute right-0 mt-2 w-56
                bg-gray-900/95 backdrop-blur-xl
                border border-gray-800
                rounded-2xl
                shadow-[0_20px_50px_rgba(0,0,0,0.5)]
                overflow-hidden
                z-50
            "
					>
						{!showDeleteConfirm ? (
							/* --- MAIN MENU VIEW --- */
							<div className="py-1">
								{/* Copy Link: Visible to everyone */}
								<MenuItem
									icon={<Link size={16} />}
									label="Copy link"
									onClick={() => {
										navigator.clipboard.writeText(
											`${window.location.origin}/post/${postId}`,
										);
										setOpen(false);
										setShowDeleteConfirm(false);
									}}
								/>

								<div className="h-px bg-gray-800/50 my-1" />

								{isOwner ? (
									/* OWNER OPTIONS */
									<>
										<MenuItem
											icon={<Trash2 size={16} />}
											label="Delete Post"
											color="text-red-400 hover:bg-red-500/10"
											onClick={() =>
												setShowDeleteConfirm(true)
											}
										/>
									</>
								) : (
									/* VISITOR OPTIONS */
									<>
										<MenuItem
											icon={<EyeOff size={16} />}
											label="Not interested"
											color="hover:text-yellow-400"
										/>
										<MenuItem
											icon={<UserX size={16} />}
											label="Mute user"
											color="hover:text-orange-400"
										/>
										<div className="h-px bg-gray-800/50 my-1" />
										<MenuItem
											icon={<Flag size={16} />}
											label="Report"
											color="hover:text-red-400"
											onClick={() => {
												setIsReportOpen(true);
												setOpen(false);
												setShowDeleteConfirm(false);
											}}
										/>
									</>
								)}
							</div>
						) : (
							/* --- DELETE CONFIRMATION VIEW --- */
							<motion.div
								initial={{ opacity: 0, x: 10 }}
								animate={{ opacity: 1, x: 0 }}
								className="p-4 space-y-3"
							>
								<div className="flex items-center gap-2 text-red-400">
									<AlertTriangle
										size={16}
										strokeWidth={2.5}
									/>
									<span className="text-[11px] font-bold uppercase tracking-widest">
										Confirm Delete
									</span>
								</div>

								<p className="text-[12px] text-gray-400 leading-snug">
									Are you sure? This post and all its data
									will be permanently removed.
								</p>

								<div className="flex flex-col gap-2 pt-1">
									<button
										onClick={handleDelete}
										className="w-full py-2 bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold rounded-lg transition-all shadow-lg shadow-red-500/20"
									>
										DELETE PERMANENTLY
									</button>
									<button
										onClick={() =>
											setShowDeleteConfirm(false)
										}
										className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-medium rounded-lg transition-all"
									>
										CANCEL
									</button>
								</div>
							</motion.div>
						)}
					</motion.div>
				)}
			</AnimatePresence>

			<ReportModal
				isOpen={isReportOpen}
				onClose={() => setIsReportOpen(false)}
				entityId={postId}
				entityType="post"
			/>
		</div>
	);
}

function MenuItem({
	icon,
	label,
	color = "hover:text-white",
	onClick,
}: {
	icon: React.ReactNode;
	label: string;
	color?: string;
	onClick?: () => void;
}) {
	return (
		<button
			onClick={onClick}
			className={`
				w-full flex items-center gap-3 px-4 py-2.5
				text-sm text-gray-300
				hover:bg-gray-800/70
				transition
				${color}
			`}
		>
			<span className="opacity-80">{icon}</span>
			<span>{label}</span>
		</button>
	);
}
