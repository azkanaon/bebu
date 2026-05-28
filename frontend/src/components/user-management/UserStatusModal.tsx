"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { X, User, ShieldAlert, Clock3, CheckCircle2 } from "lucide-react";

import { updateUserStatusAPI } from "@/lib/api";

interface UserStatusModalProps {
	user: {
		user_id: number;
		username: string;
		status: "active" | "suspended" | "banned" | "shadowbanned" | string;
		duration_days?: number | null;
		updated_at?: string;
	} | null;
	onClose: () => void;
	onActionSuccess?: () => void;
}

interface ActionOption {
	value: "active" | "banned";
	label: string;
	description: string;
	icon: any;
	tone: "neutral" | "danger";
}

export default function UserStatusModal({
	user,
	onClose,
	onActionSuccess,
}: UserStatusModalProps) {
	// State pilihan status hanya menampung "active" atau "banned"
	const [selectedStatus, setSelectedStatus] = useState<
		"active" | "banned" | ""
	>("");
	const [submitting, setSubmitting] = useState(false);

	// Jika status awal user sudah "banned", admin tidak bisa mengubah statusnya lagi
	const isLockedByBan = user?.status === "banned";

	useEffect(() => {
		if (!user) return;

		// Jika status awal user adalah "active" atau "banned", langsung set pas modal dibuka
		if (user.status === "active" || user.status === "banned") {
			setSelectedStatus(user.status);
		} else {
			// Jika statusnya "shadowbanned" atau "suspended", biarkan pilihan kosong agar admin memilih secara eksplisit
			setSelectedStatus("");
		}
	}, [user]);

	const handleUpdateStatus = async () => {
		if (!selectedStatus || !user || isLockedByBan) return;

		setSubmitting(true);
		try {
			// Memanggil API bawaan: updateUserStatusAPI(userID, status)
			// Catatan: Jika string di backend Anda menggunakan "actived", ubah nilainya di bawah ini
			const response = await updateUserStatusAPI(
				user.user_id,
				selectedStatus,
			);

			alert(response.message || "User status updated successfully.");
			onActionSuccess?.();
			onClose();
		} catch (err: any) {
			alert(
				err?.response?.data?.error ||
					err?.message ||
					"Failed to update user status.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	if (!user) return null;

	// Hanya menyediakan 2 opsi tindakan langsung dari panel user management
	const actionOptions: ActionOption[] = [
		{
			value: "active",
			label: "Activate / Restore Account",
			description:
				"Set user status to active and grant standard platform access.",
			icon: CheckCircle2,
			tone: "neutral",
		},
		{
			value: "banned",
			label: "Permanent Ban",
			description:
				"Permanently terminate user access and freeze the profile completely.",
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
							<User size={12} />
							User Management
						</div>
						<h2 className="mt-3 text-lg font-semibold text-white">
							Account Status Control
						</h2>
						<p className="mt-1 text-xs text-zinc-500">
							Target User: @{user.username} (ID: {user.user_id})
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
					{/* Warning Alert khusus jika akun berstatus Banned */}
					{isLockedByBan && (
						<div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-4 flex gap-3 items-start">
							<ShieldAlert
								size={16}
								className="text-red-400 shrink-0 mt-0.5"
							/>
							<div>
								<h5 className="text-xs font-semibold text-red-200">
									Account Permanently Banned
								</h5>
								<p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">
									This account has been permanently
									terminated. Actions on banned accounts are
									locked and cannot be overridden from this
									panel.
								</p>
							</div>
						</div>
					)}

					{/* CURRENT STATUS DETAILS CARD (Tetap menampilkan 4 macam status asli dari backend) */}
					<div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/[0.10] text-blue-300">
								<User size={18} />
							</div>
							<div>
								<h3 className="text-sm font-semibold text-white">
									@{user.username}
								</h3>
								{/* Menampilkan informasi durasi penahanan jika statusnya shadowbanned/suspended */}
								{(user.status === "suspended" ||
									user.status === "shadowbanned") &&
								user.duration_days ? (
									<p className="text-[11px] text-zinc-400 mt-0.5">
										Restriction remaining:{" "}
										<span className="text-amber-300 font-medium">
											{user.duration_days === -1
												? "Indefinite"
												: `${user.duration_days} days`}
										</span>
									</p>
								) : (
									<p className="text-[11px] text-zinc-500">
										System Identifier #{user.user_id}
									</p>
								)}
							</div>
						</div>

						<div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/5 px-2.5 py-1 text-[11px]">
							<span className="text-zinc-500">Status:</span>
							<span
								className={clsx(
									"font-medium uppercase tracking-wider text-[10px]",
									user.status === "active" &&
										"text-emerald-400",
									user.status === "shadowbanned" &&
										"text-amber-400",
									user.status === "suspended" &&
										"text-orange-400",
									user.status === "banned" && "text-red-400",
								)}
							>
								{user.status}
							</span>
						</div>
					</div>

					{/* STATUS OPTIONS */}
					<div className="space-y-3">
						<div>
							<p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
								Status Override
							</p>
							<h4 className="mt-1 text-xs text-zinc-400">
								Override the user state to one of the following
								root states
							</h4>
						</div>

						<div className="grid gap-3">
							{actionOptions.map((action) => {
								const Icon = action.icon;
								const isActive =
									selectedStatus === action.value;

								return (
									<button
										key={action.value}
										type="button"
										disabled={isLockedByBan}
										onClick={() =>
											setSelectedStatus(action.value)
										}
										className={clsx(
											"group relative overflow-hidden rounded-[22px] border p-4 text-left transition-all duration-200",
											isActive
												? "border-blue-500/30 bg-blue-500/[0.08]"
												: "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
											isLockedByBan &&
												"opacity-40 cursor-not-allowed",
										)}
									>
										<div className="flex items-center gap-4">
											<div
												className={clsx(
													"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
													action.tone === "danger"
														? "bg-red-500/[0.10] text-red-300"
														: "bg-emerald-500/[0.10] text-emerald-300",
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
						Changes take effect immediately
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
							// Di-disabled jika submitting, belum pilih status, atau status pilihan sama dengan status saat ini, atau akun terkunci karena banned
							disabled={
								submitting ||
								!selectedStatus ||
								selectedStatus === user.status ||
								isLockedByBan
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
