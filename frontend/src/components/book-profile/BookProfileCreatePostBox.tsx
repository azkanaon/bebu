"use client";

import { motion } from "framer-motion";
import { usePostModal } from "@/stores/postModal";
import { PenTool } from "lucide-react";

type BookProfileCreatePostBoxProps = {
	activeTab: "review" | "analysis";
	bookTitle: string;
	bookId: number;
};

export default function BookProfileCreatePostBox({
	activeTab,
	bookTitle,
	bookId,
}: BookProfileCreatePostBoxProps) {
	const openPostModal = usePostModal((state) => state.open);

	// Ambil data user login secara aman dari local storage
	const authStorage =
		typeof window !== "undefined"
			? localStorage.getItem("bebu-auth-storage")
			: null;
	const parsedStorage = authStorage ? JSON.parse(authStorage) : null;
	const user = parsedStorage?.state?.user;

	const handleBoxClick = () => {
		// Dinamis membuka modal sesuai tab yang sedang dilihat user saat ini
		openPostModal(activeTab, {
			id: bookId,
			title: bookTitle,
		});
	};

	return (
		<motion.div
			onClick={handleBoxClick}
			whileHover={{ y: -1 }}
			whileTap={{ scale: 0.995 }}
			className="
                bg-slate-900/40 
                border border-white/[0.05] 
                rounded-2xl 
                p-4 
                cursor-pointer 
                transition-all 
                duration-200 
                hover:border-blue-500/30 
                hover:bg-slate-900/60
            "
		>
			<div className="flex items-center gap-3">
				{/* Avatar Pengguna Asli */}
				<img
					src={
						user?.avatar ||
						`https://ui-avatars.com/api/?name=${user?.username || "User"}&background=2563eb&color=fff`
					}
					className="w-9 h-9 rounded-full border border-white/10 object-cover"
					alt="Your avatar"
				/>

				{/* Fake Input Area */}
				<div className="flex-1 relative">
					<div
						className="
                            w-full
                            bg-slate-950/40
                            border border-white/[0.06]
                            rounded-full
                            pl-4 pr-10 py-2
                            text-xs text-gray-400
                            transition-all duration-200
                            hover:bg-slate-950/70
                            hover:border-white/[0.1]
                            flex items-center
                        "
					>
						Tulis {activeTab === "review" ? "Review" : "Analisis"}{" "}
						untuk{" "}
						<span className="text-blue-400 font-medium ml-1 truncate max-w-[220px]">
							{bookTitle}
						</span>
						...
					</div>

					{/* Pen Icon pengganti Send, karena sifatnya membuka Editor/Modal */}
					<div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500">
						<PenTool
							size={14}
							className="opacity-70 group-hover:text-blue-400 transition-colors"
						/>
					</div>
				</div>
			</div>
		</motion.div>
	);
}