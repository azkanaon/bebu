"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	MoreVertical,
	Flag,
	Link,
	Trash2,
	AlertTriangle,
	Lock, // 🔥 Tambahkan ikon gembok untuk indikasi proteksi
} from "lucide-react";
import ReportModal from "./ReportModal";
import { deletePostAPI } from "@/lib/api";
import { toast } from "react-hot-toast";

interface PostMenuProps {
	postId: number;
	postPublicID: string;
	userPublicID: string;
}

export default function PostMenu({
	postId,
	postPublicID,
	userPublicID,
}: PostMenuProps) {
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

	const authStorage =
		typeof window !== "undefined"
			? localStorage.getItem("bebu-auth-storage")
			: null;
	const parsedStorage = authStorage ? JSON.parse(authStorage) : null;
	const user = parsedStorage?.state?.user;
	const currentUserId = user?.user_public_id;

	// 🔥 Pengecekan status penangguhan akun pengguna
	const isSuspended = user?.status === "suspended";

	// Cek apakah user yang login adalah pemilik postingan
	const isOwner = String(userPublicID) === String(currentUserId);

	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		if (isDeleting) return; // Mencegah double submit jika di-klik cepat

		try {
			setIsDeleting(true);

			// Tampilkan loading toast
			toast.loading("Menghapus postingan...", {
				id: "delete-post-toast",
				style: {
					background: "#111827", // Menyesuaikan tema gelap (gray-900)
					color: "#fff",
					borderRadius: "12px",
					border: "1px solid #1f2937",
				},
			});

			// Panggil API Backend (Proses DB & Cloudinary berjalan di BE)
			await deletePostAPI(postPublicID);

			// Ubah loading toast menjadi success toast
			toast.success("Postingan berhasil dihapus", {
				id: "delete-post-toast",
				style: {
					background: "#111827",
					color: "#fff",
					borderRadius: "12px",
					border: "1px solid #1f2937",
				},
			});

			// Tutup semua state dropdown/konfirmasi
			setOpen(false);
			setShowDeleteConfirm(false);

			// Beri jeda sedikit (misal 800ms) agar user sempat melihat toast sukses sebelum halaman di-reload
			setTimeout(() => {
				window.location.reload();
			}, 800);
		} catch (error: unknown) {
			console.error("Delete error:", error);

			// Ubah loading toast menjadi error toast jika gagal
			toast.error("Gagal menghapus postingan", {
				id: "delete-post-toast",
				style: {
					background: "#111827",
					color: "#fff",
					borderRadius: "12px",
					border: "1px solid #1f2937",
				},
			});
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="relative" ref={ref}>
			{/* Trigger */}
			<button
				onClick={() => setOpen(!open)}
				className="p-2 rounded-full hover:bg-gray-800 transition cursor-pointer"
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
											`${window.location.origin}/post/${postPublicID}`,
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
										{/* 🔥 Kunci interaksi report dengan mengecek state isSuspended */}
										<MenuItem
											disabled={isSuspended}
											icon={<Flag size={16} />}
											label={
												isSuspended
													? "Report Locked"
													: "Report"
											}
											color={
												isSuspended
													? "text-red-400/50 bg-red-950/10 cursor-not-allowed hover:bg-red-950/10"
													: "hover:text-red-400"
											}
											rightIcon={
												isSuspended ? (
													<Lock
														size={12}
														className="text-red-400/40 ml-auto"
													/>
												) : undefined
											}
											onClick={() => {
												if (isSuspended) return; // Proteksi berlapis
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
										disabled={isDeleting} // Nonaktifkan tombol saat sedang proses hapus
										className={`w-full py-2 text-white text-[11px] font-bold rounded-lg transition-all shadow-lg cursor-pointer
                ${
					isDeleting
						? "bg-red-500/50 cursor-not-allowed shadow-none"
						: "bg-red-500 hover:bg-red-600 shadow-red-500/20"
				}`}
									>
										{isDeleting
											? "DELETING..."
											: "DELETE PERMANENTLY"}{" "}
									</button>
									<button
										onClick={() =>
											!isDeleting &&
											setShowDeleteConfirm(false)
										} // Tidak ijinkan cancel jika sedang menghapus
										disabled={isDeleting}
										className={`w-full py-2 text-gray-300 text-[11px] font-medium rounded-lg transition-all cursor-pointer
                ${isDeleting ? "bg-white/0 text-gray-500 cursor-not-allowed" : "bg-white/5 hover:bg-white/10"}`}
									>
										CANCEL
									</button>
								</div>
							</motion.div>
						)}
					</motion.div>
				)}
			</AnimatePresence>

			{/* Modal Proteksi Berlapis */}
			<ReportModal
				isOpen={isReportOpen && !isSuspended}
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
	disabled = false,
	rightIcon,
}: {
	icon: React.ReactNode;
	label: string;
	color?: string;
	onClick?: () => void;
	disabled?: boolean;
	rightIcon?: React.ReactNode;
}) {
	return (
		<button
			disabled={disabled}
			onClick={onClick}
			className={`
                w-full flex items-center gap-3 px-4 py-2.5
                text-sm text-gray-300
                transition duration-150
                ${disabled ? "" : "hover:bg-gray-800/70 cursor-pointer"}
                ${color}
            `}
		>
			<span className="opacity-80">{icon}</span>
			<span>{label}</span>
			{rightIcon}
		</button>
	);
}
