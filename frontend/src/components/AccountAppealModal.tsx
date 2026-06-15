"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, AlertTriangle, Paperclip, Trash2 } from "lucide-react";
import { createAccountAppealAPI } from "@/lib/api";

interface AccountAppealModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export default function AccountAppealModal({
	isOpen,
	onClose,
	onSuccess,
}: AccountAppealModalProps) {
	const [reason, setReason] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);

	// Efek samping untuk membersihkan memory leak dari URL preview blob
	useEffect(() => {
		if (!imageFile) {
			setImagePreview(null);
			return;
		}

		const objectUrl = URL.createObjectURL(imageFile);
		setImagePreview(objectUrl);

		return () => URL.revokeObjectURL(objectUrl);
	}, [imageFile]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];

			// Validasi ukuran gambar maksimal 5MB
			if (file.size > 5 * 1024 * 1024) {
				setError(
					"The image file is too large. The maximum allowed file size is 5 MB.",
				);
				return;
			}

			setImageFile(file);
			setError(null);
		}
	};

	const handleRemoveImage = () => {
		setImageFile(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedReason = reason.trim();

		if (trimmedReason.length < 20) {
			setError(
				"Your appeal explanation is too short. Please provide at least 20 characters.",
			);
			return;
		}

		setSubmitting(true);
		setError(null);

		// 💡 Bungkus seluruh payload ke dalam instance FormData objek
		const formData = new FormData();
		formData.append("appeal_reason", trimmedReason);
		if (imageFile) {
			// Key "evidence_image" wajib sama dengan c.FormFile("evidence_image") di Go backend
			formData.append("evidence_image", imageFile);
		}

		try {
			await createAccountAppealAPI(formData);

			if (onSuccess) onSuccess();

			setReason("");
			handleRemoveImage();
			onClose();
		} catch (err: any) {
			const errMsg =
				err?.response?.data?.error ||
				err?.message || // Menampilkan error axios seperti "Network Error"
				"Failed to submit your appeal. Please try again.";
			setError(errMsg);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
					{/* Backdrop dengan Blur */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={!submitting ? onClose : undefined}
						className="absolute inset-0 bg-black/80 backdrop-blur-sm"
					/>

					{/* Konten Utama Modal */}
					<motion.div
						initial={{ scale: 0.95, opacity: 0, y: 20 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.95, opacity: 0, y: 20 }}
						transition={{
							type: "spring",
							damping: 25,
							stiffness: 250,
						}}
						className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
					>
						{/* Tombol Close */}
						<button
							onClick={onClose}
							disabled={submitting}
							className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-30"
						>
							<X size={18} />
						</button>

						{/* Header Modal */}
						<div className="flex items-start gap-3 mt-1">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
								<AlertTriangle size={20} />
							</div>
							<div>
								<h3 className="text-base font-bold text-zinc-100">
									Appeal Account Suspension
								</h3>
								<p className="text-xs text-zinc-400 mt-0.5">
									Provide a clear explanation and supporting
									evidence for us to review your account
									suspension.
								</p>
							</div>
						</div>

						{/* Form Pengisian */}
						<form
							onSubmit={handleSubmit}
							className="mt-5 space-y-4"
						>
							{/* Input Teks Alasan */}
							<div>
								<label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
									Your Explanation / Appeal
								</label>
								<textarea
									value={reason}
									onChange={(e) => {
										setReason(e.target.value);
										if (error) setError(null);
									}}
									disabled={submitting}
									placeholder="Describe the situation in detail or provide supporting information for your appeal here..."
									rows={4}
									className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500/40 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition-all resize-none disabled:opacity-50"
								/>
								<div className="flex justify-between items-center mt-1.5 px-0.5">
									<span
										className={`text-[10px] ${reason.trim().length < 20 ? "text-zinc-500" : "text-emerald-400"}`}
									>
										{reason.trim().length} characters (Min.
										20)
									</span>
								</div>
							</div>

							{/* Input Bukti Gambar Gambar (Opsional) */}
							<div>
								<label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
									Supporting Evidence Image{" "}
									<span className="text-zinc-600 font-normal text-[10px]">
										(Optional)
									</span>
								</label>

								<input
									type="file"
									ref={fileInputRef}
									onChange={handleFileChange}
									accept="image/*"
									className="hidden"
									disabled={submitting}
								/>

								{!imagePreview ? (
									<button
										type="button"
										onClick={() =>
											fileInputRef.current?.click()
										}
										disabled={submitting}
										className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.01] hover:bg-white/[0.03] px-4 py-3.5 text-xs font-medium text-zinc-400 transition-all disabled:opacity-50"
									>
										<Paperclip
											size={14}
											className="text-zinc-500"
										/>
										Select an Evidence Image (Max 5 MB)
									</button>
								) : (
									<div className="relative rounded-xl border border-white/10 bg-white/[0.02] p-2 flex items-center gap-3">
										<div className="relative h-12 w-12 rounded-lg overflow-hidden border border-white/5 bg-zinc-900 shrink-0">
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={imagePreview}
												alt="Preview Bukti"
												className="h-full w-full object-cover"
											/>
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-xs font-medium text-zinc-300 truncate">
												{imageFile?.name}
											</p>
											<p className="text-[10px] text-zinc-500 mt-0.5">
												{(
													(imageFile?.size || 0) /
													(1024 * 1024)
												).toFixed(2)}{" "}
												MB
											</p>
										</div>
										<button
											type="button"
											onClick={handleRemoveImage}
											disabled={submitting}
											className="p-2 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30"
										>
											<Trash2 size={15} />
										</button>
									</div>
								)}
							</div>

							{/* Tampilan Pesan Error */}
							{error && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/15 rounded-xl p-3"
								>
									{error}
								</motion.div>
							)}

							{/* Tombol Aksi */}
							<div className="flex items-center justify-end gap-2 pt-2">
								<button
									type="button"
									onClick={onClose}
									disabled={submitting}
									className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-all disabled:opacity-30"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={
										submitting || reason.trim().length < 20
									}
									className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-300 transition-all disabled:opacity-30 disabled:bg-zinc-800 disabled:text-zinc-500"
								>
									{submitting ? (
										<>
											<div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
											Mengirim...
										</>
									) : (
										<>
											<Send size={13} />
											Submit Appeal
										</>
									)}
								</button>
							</div>
						</form>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
