import React, { useState, useEffect } from "react";
import { Flag, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { createReportAPI } from "@/lib/api"; // sesuaikan path api Anda
import { createPortal } from "react-dom";

interface ReportModalProps {
	isOpen: boolean;
	onClose: () => void;
	entityId: number;
	entityType: "post" | "comment" | "user";
}

const POST_CATEGORIES = [
	"Spam / Konten Berulang",
	"Ujaran Kebencian atau SARA",
	"Pelecehan atau Harassment",
	"Kekerasan atau Ancaman",
	"Pornografi atau Konten Seksual",
	"Informasi Palsu / Hoax",
	"Ketidaknyamanan Lainnya",
];

const COMMENT_CATEGORIES = [
	"Komentar Kasar / Toxic",
	"Spam di Komentar",
	"Ujaran Kebencian",
	"Pelecehan / Harassment",
	"Ketidaknyamanan Lainnya",
];

const USER_CATEGORIES = [
	"Akun Palsu / Penyamaran",
	"Foto Profil Tidak Pantas",
	"Nama Pengguna Melanggar Aturan",
	"Target Harassment",
];

const ReportModal: React.FC<ReportModalProps> = ({
	isOpen,
	onClose,
	entityId,
	entityType,
}) => {
    const [mounted, setMounted] = useState(false);
	const [selectedReason, setSelectedReason] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	const getCategories = () => {
		switch (entityType) {
			case "post":
				return POST_CATEGORIES;
			case "comment":
				return COMMENT_CATEGORIES;
			case "user":
				return USER_CATEGORIES;
			default:
				return POST_CATEGORIES;
		}
	};

	const currentCategories = getCategories();

    useEffect(() => {
		const timeout = requestAnimationFrame(() => {
			setMounted(true);
		});
		return () => cancelAnimationFrame(timeout);
	}, []);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		// Cleanup saat modal di-unmount atau ditutup
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	const getEntityLabel = () => {
		switch (entityType) {
			case "post":
				return "Postingan";
			case "comment":
				return "Komentar";
			case "user":
				return "Pengguna";
			default:
				return "Konten";
		}
	};

	if (!mounted || !isOpen) return null;

	const handleReport = async () => {
        console.log("Data Laporan:", {
			entity_id: entityId,
			entity_type: entityType,
			reason: selectedReason,
		});
		if (!selectedReason) return;

		setLoading(true);
		try {
			await createReportAPI({
				entity_id: entityId,
				entity_type: entityType,
				reason_text: selectedReason,
			});
			setSuccess(true);
			setTimeout(() => {
				setSuccess(false);
				setSelectedReason("");
				onClose();
			}, 2000);
		} catch (error) {
			console.error("Failed to submit report:", error);
			alert("Gagal mengirim laporan. Silakan coba lagi.");
		} finally {
			setLoading(false);
		}
	};

    const modalContent = (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
			{/* Overlay */}
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Modal Content */}
			<div className="relative bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
					<div className="flex items-center gap-2">
						<div className="p-2 bg-red-500/10 rounded-lg">
							<AlertTriangle size={18} className="text-red-500" />
						</div>
						<h3 className="font-semibold text-white">
							Laporkan {getEntityLabel()}
						</h3>
					</div>
					<button
						onClick={onClose}
						className="p-1 text-gray-500 hover:text-white transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				{!success ? (
					<>
						{/* Body - Categories */}
						<div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
							<p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
								Kenapa Anda melaporkan{" "}
								{getEntityLabel().toLowerCase()} ini?
							</p>
							<div className="space-y-1">
								{currentCategories.map((cat) => (
									<button
										key={cat}
										onClick={() => setSelectedReason(cat)}
										className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
											selectedReason === cat
												? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
												: "hover:bg-gray-800 text-gray-400 border border-transparent"
										}`}
									>
										<span className="text-sm font-medium">
											{cat}
										</span>
										{selectedReason === cat && (
											<div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]" />
										)}
									</button>
								))}
							</div>
						</div>

						{/* Footer */}
						<div className="p-4 bg-gray-950/50 border-t border-gray-800 flex gap-3">
							<button
								onClick={onClose}
								className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors"
							>
								Batal
							</button>
							<button
								onClick={handleReport}
								disabled={loading || !selectedReason}
								className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
							>
								{loading ? (
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								) : (
									<>
										{" "}
										<Flag size={14} /> Kirim Laporan{" "}
									</>
								)}
							</button>
						</div>
					</>
				) : (
					/* Success State */
					<div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
						<div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
							<CheckCircle2
								size={40}
								className="text-green-500"
							/>
						</div>
						<div>
							<h4 className="text-white font-semibold">
								Laporan Terkirim
							</h4>
							<p className="text-gray-500 text-xs mt-1">
								Terima kasih, kami akan meninjau laporan Anda
								segera.
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
};

export default ReportModal;
