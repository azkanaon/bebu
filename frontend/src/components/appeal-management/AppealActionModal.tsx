"use client";

import { useEffect, useState, useCallback } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion"; // Tambahkan import framer-motion
import {
	X,
	ShieldAlert,
	Clock3,
	CheckCircle2,
	XCircle,
	Eye,
} from "lucide-react";
import { getAdminAppealDetailAPI, submitAdminAppealActionAPI } from "@/lib/api";
import { AdminAppealDetail } from "@/types/appeal";
import ClientPortal from "@/components/ClientPortal"; // Sesuaikan jalur ClientPortal kamu jika ada

interface AppealActionModalProps {
	appealID: number | null;
	onClose: () => void;
	onActionSuccess?: () => void;
}

interface ActionOption {
	value: "Approved" | "Rejected";
	label: string;
	description: string;
	icon: any;
	tone: "success" | "danger";
}

export default function AppealActionModal({
	appealID,
	onClose,
	onActionSuccess,
}: AppealActionModalProps) {
	const [detail, setDetail] = useState<AdminAppealDetail | null>(null);
	const [loadingDetail, setLoadingDetail] = useState(false);
	const [selectedAction, setSelectedAction] = useState<
		"Approved" | "Rejected" | ""
	>("");
	const [adminNotes, setAdminNotes] = useState("");
	const [submitting, setSubmitting] = useState(false);

	// State tambahan khusus untuk tracking modal zoom gambar fullscreen
	const [isImageOpen, setIsImageOpen] = useState(false);

	// Kunci scroll global body saat gambar sedang dizoom penuh
	useEffect(() => {
		if (isImageOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isImageOpen]);

	// Memuat data mendalam dari backend saat modal terbuka
	const loadAppealDetail = useCallback(async (id: number) => {
		setLoadingDetail(true);
		try {
			const res = await getAdminAppealDetailAPI(id);
			setDetail(res.data);

			if (
				res.data.status === "Approved" ||
				res.data.status === "Rejected"
			) {
				setSelectedAction(res.data.status);
				setAdminNotes(res.data.adminNotes || "");
			} else {
				setSelectedAction("");
				setAdminNotes("");
			}
		} catch (err) {
			console.error("Gagal memuat rincian data banding admin:", err);
		} finally {
			setLoadingDetail(false);
		}
	}, []);

	useEffect(() => {
		if (appealID) {
			loadAppealDetail(appealID);
		} else {
			setDetail(null);
		}
	}, [appealID, loadAppealDetail]);

	if (!appealID) return null;

	const isAlreadyProcessed = detail?.status !== "Pending";

	const handleProcessAction = async () => {
		if (!selectedAction || !detail || isAlreadyProcessed) return;

		const trimmedNotes = adminNotes.trim();
		if (trimmedNotes.length < 5) {
			alert(
				"Mohon sertakan catatan peninjauan admin minimal 5 karakter.",
			);
			return;
		}

		setSubmitting(true);
		try {
			const response = await submitAdminAppealActionAPI(
				detail.accountAppealID,
				{
					status: selectedAction,
					adminNotes: trimmedNotes,
				},
			);

			alert(response.message || "Keputusan banding berhasil disimpan.");
			onActionSuccess?.();
			onClose();
		} catch (err: any) {
			alert(
				err?.response?.data?.error ||
					err?.message ||
					"Gagal memproses keputusan banding admin.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	const actionOptions: ActionOption[] = [
		{
			value: "Approved",
			label: "Approve Appeal & Restore",
			description:
				"Menerima alasan pembelaan dan mengembalikan status akun menjadi active.",
			icon: CheckCircle2,
			tone: "success",
		},
		{
			value: "Rejected",
			label: "Reject Appeal & Maintain",
			description:
				"Menolak pembelaan dan mempertahankan status akun tetap ditangguhkan.",
			icon: XCircle,
			tone: "danger",
		},
	];

	return (
		<>
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
                        relative w-full max-w-xl flex flex-col max-h-[90vh] rounded-3xl
                        border border-white/10 bg-[#09090B]/95 backdrop-blur-2xl
                        shadow-2xl shadow-black/50
                        animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-4
                        duration-300
                    "
				>
					{/* Ambient Glow Effect (Orange/Amber) */}
					<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.06),transparent_40%)]" />

					{/* HEADER */}
					<div className="relative flex-none flex items-start justify-between border-b border-white/5 px-6 py-5">
						<div>
							<div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-orange-400/80 font-semibold">
								<ShieldAlert size={12} />
								Appeal Enforcement Panel
							</div>
							<h2 className="mt-3 text-lg font-semibold text-white">
								Tinjau Pengajuan Banding
							</h2>
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

					{/* CONTENT LAYOUT CONTAINER (DENGAN CUSTOM SCROLL) */}
					<div className="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-5">
						{loadingDetail || !detail ? (
							<div className="p-12 text-center text-sm text-zinc-500 flex items-center justify-center gap-2">
								<div className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-ping" />
								Memuat detail berkas banding...
							</div>
						) : (
							<>
								{/* WARNING BANNER JIKA SUDAH DIPUTUS */}
								{isAlreadyProcessed && (
									<div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.05] p-4 flex gap-3 items-start">
										<ShieldAlert
											size={16}
											className="text-orange-400 shrink-0 mt-0.5"
										/>
										<div>
											<h5 className="text-xs font-semibold text-orange-200">
												Banding Telah Selesai Ditinjau
											</h5>
											<p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">
												Berkas ini sudah bersifat final
												dengan keputusan bertipe{" "}
												<span className="font-bold uppercase text-orange-300">
													{detail.status}
												</span>
												. Aksi perubahan sudah dikunci.
											</p>
										</div>
									</div>
								)}

								{/* KRONOLOGIS KASUS & ALASAN USER */}
								<div className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.01] p-4">
									<div>
										<span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
											Applicant / Target
										</span>
										<span className="text-sm font-medium text-white">
											@{detail.username}
										</span>
									</div>

									<div className="border-t border-white/5 pt-2">
										<span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
											Sebab Penangguhan Awal
										</span>
										<p className="text-xs text-zinc-300 mt-0.5 italic">
											&quot;{detail.suspensionReason}
											&quot;
										</p>
									</div>

									<div className="border-t border-white/5 pt-2">
										<span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
											Alasan Pembelaan Pengguna
										</span>
										<p className="text-xs text-zinc-200 mt-1 bg-black/30 p-3 rounded-xl border border-white/5 leading-relaxed whitespace-pre-wrap">
											{detail.appealReason}
										</p>
									</div>

									{/* MODIFIKASI LAMPIRAN GAMBAR MATRIKS BLUR ANALYSIS POST */}
									{detail.evidenceURL && (
										<div className="border-t border-white/5 pt-3">
											<span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
												<Eye size={12} /> Gambar Bukti
												Terlampir
											</span>

											<motion.div
												whileHover={{ scale: 1.005 }}
												onClick={() =>
													setIsImageOpen(true)
												}
												className="
                                                    relative w-full h-[260px] overflow-hidden rounded-xl
                                                    border border-white/10 bg-zinc-950
                                                    cursor-zoom-in group
                                                "
											>
												{/* Lapisan 1: Background Blur jika aspek rasio gambar tidak memenuhi frame kotak */}
												<img
													src={detail.evidenceURL}
													alt="blur background"
													className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40"
												/>
												{/* Lapisan 2: Gambar Utama bertipe object-contain agar tidak terpotong */}
												<img
													src={detail.evidenceURL}
													alt="evidence content"
													className="relative z-10 w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
												/>
												{/* Lapisan 3: Hover Overlay dengan icon Kaca Pembesar (Zoom) */}
												<div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center">
													<div className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white/80">
														<svg
															xmlns="http://www.w3.org/2000/svg"
															width="20"
															height="20"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															strokeWidth="2"
														>
															<circle
																cx="11"
																cy="11"
																r="8"
															/>
															<line
																x1="21"
																y1="21"
																x2="16.65"
																y2="16.65"
															/>
															<line
																x1="11"
																y1="8"
																x2="11"
																y2="14"
															/>
															<line
																x1="8"
																y1="11"
																x2="14"
																y2="11"
															/>
														</svg>
													</div>
												</div>
											</motion.div>
										</div>
									)}
								</div>

								{/* INPUT FORM INTERAKTIF MODERASI */}
								<div className="space-y-4">
									<div>
										<p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
											Review Decision
										</p>
									</div>

									<div className="grid gap-3">
										{actionOptions.map((action) => {
											const Icon = action.icon;
											const isActive =
												selectedAction === action.value;

											return (
												<button
													key={action.value}
													type="button"
													disabled={
														isAlreadyProcessed
													}
													onClick={() =>
														setSelectedAction(
															action.value,
														)
													}
													className={clsx(
														"group relative overflow-hidden rounded-[22px] border p-4 text-left transition-all duration-200",
														isActive
															? "border-orange-500/30 bg-orange-500/[0.08]"
															: "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
														isAlreadyProcessed &&
															"opacity-50 cursor-not-allowed",
													)}
												>
													<div className="flex items-center gap-4">
														<div
															className={clsx(
																"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
																action.tone ===
																	"danger"
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
																{
																	action.description
																}
															</p>
														</div>
														<div
															className={clsx(
																"h-4 w-4 rounded-full border flex items-center justify-center transition-all",
																isActive
																	? "border-orange-500 bg-orange-500"
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

								{/* TEXTAREA NOTES ADMIN */}
								<div className="space-y-2">
									<label className="block text-[10px] uppercase tracking-[0.18em] text-zinc-500">
										Catatan Tinjauan Admin / Alasan Putusan
									</label>
									<textarea
										value={adminNotes}
										onChange={(e) =>
											setAdminNotes(e.target.value)
										}
										disabled={
											isAlreadyProcessed || submitting
										}
										rows={3}
										placeholder="Tuliskan catatan rincian alasan menyetujui atau menolak permohonan banding ini..."
										className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-orange-500/40 focus:outline-none focus:ring-1 focus:ring-orange-500/40 transition-all resize-none disabled:opacity-50"
									/>
								</div>
							</>
						)}
					</div>

					{/* FOOTER ACTIONS */}
					<div className="flex-none flex items-center justify-between border-t border-white/5 bg-black/20 px-6 py-4">
						<div className="flex items-center gap-2 text-[10px] text-zinc-500">
							<Clock3 size={12} className="text-orange-400/70" />
							Review log will update player data instantly
						</div>

						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={onClose}
								className="h-9 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-xs font-medium text-zinc-300 transition-all duration-200 hover:border-white/20 hover:text-white"
							>
								Close
							</button>
							<button
								type="button"
								onClick={handleProcessAction}
								disabled={
									submitting ||
									!selectedAction ||
									adminNotes.trim().length < 5 ||
									isAlreadyProcessed
								}
								className="h-9 rounded-xl bg-orange-500 px-4 text-xs font-semibold text-white transition-all duration-200 hover:bg-orange-400 disabled:pointer-events-none disabled:opacity-30"
							>
								{submitting
									? "Processing..."
									: "Submit Verdict"}
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* ENHANCED IMAGE MODAL PORTAL UNTUK FULLSCREEN VIEW */}
			<AnimatePresence>
				{isImageOpen && detail?.evidenceURL && (
					<ClientPortal>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							onClick={() => setIsImageOpen(false)}
							className="fixed inset-0 z-[9999] bg-black cursor-zoom-out"
						>
							<img
								src={detail.evidenceURL}
								alt="blur background"
								className="absolute inset-0 w-full h-full object-cover scale-105 blur-3xl opacity-50"
							/>
							<div className="relative z-10 w-screen h-screen flex items-center justify-center">
								<motion.img
									initial={{ scale: 0.95, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.95, opacity: 0 }}
									src={detail.evidenceURL}
									alt="full screen evidence"
									onClick={(e) => e.stopPropagation()}
									className="w-full h-full object-contain pointer-events-none"
								/>
							</div>
							<button
								onClick={() => setIsImageOpen(false)}
								className="absolute top-5 right-5 z-20 p-2 rounded-full bg-black/50 text-white/80 backdrop-blur-md hover:bg-black/80 hover:text-white transition-all"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.5"
								>
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							</button>
						</motion.div>
					</ClientPortal>
				)}
			</AnimatePresence>
		</>
	);
}
