"use client";

import { motion } from "framer-motion";
import { usePostModal } from "@/stores/postModal";
import { MessageSquareText, BarChart3, Lock, AlertCircle } from "lucide-react";

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

	const authStorage =
		typeof window !== "undefined"
			? localStorage.getItem("bebu-auth-storage")
			: null;

	const parsedStorage = authStorage ? JSON.parse(authStorage) : null;
	const user = parsedStorage?.state?.user;

	// 🔥 Aturan Sistem Baru: Cek apakah user sedang ditangguhkan
	const isSuspended = user?.status === "suspended";

	const handleBoxClick = () => {
		// Jika akun ditangguhkan, batalkan pembukaan modal
		if (isSuspended) return;

		openPostModal(activeTab, {
			id: bookId,
			title: bookTitle,
		});
	};

	const isReview = activeTab === "review";

	return (
		<div className="py-1">
			<motion.button
				onClick={handleBoxClick}
				// Efek hover & tap hanya aktif atau disesuaikan jika tidak disuspend
				whileHover={!isSuspended ? { y: -1 } : { y: 0 }}
				whileTap={!isSuspended ? { scale: 0.995 } : {}}
				disabled={isSuspended} // Menambahkan atribut HTML disabled
				className={`
                    group
                    flex
                    w-full
                    items-center
                    gap-3
                    text-left
                    ${isSuspended ? "cursor-not-allowed" : ""}
                `}
			>
				{/* AVATAR */}
				<img
					src={
						user?.avatar ||
						`https://ui-avatars.com/api/?name=${
							user?.username || "User"
						}&background=2563eb&color=fff`
					}
					alt="Your avatar"
					className={`
                        h-9
                        w-9
                        shrink-0
                        rounded-full
                        border
                        object-cover
                        transition-all
                        ${isSuspended ? "border-red-500/20 grayscale-[30%]" : "border-white/10"}
                    `}
				/>

				{/* INPUT SURFACE */}
				<div
					className={`
                        flex
                        min-h-[46px]
                        flex-1
                        items-center
                        justify-between
                        rounded-full
                        border
                        px-4
                        transition-all
                        duration-300
                        ${
							isSuspended
								? "border-red-500/50 text-red-400"
								: "border-white/[0.06] bg-white/[0.02] group-hover:border-white/[0.1] group-hover:bg-white/[0.03]"
						}
                    `}
				>
					<div className="min-w-0 flex-1">
						{isSuspended ? (
							<span className="flex items-center gap-2 text-[14px] text-red-400 font-medium select-none">
								<AlertCircle
									size={14}
									className="text-red-400 shrink-0"
								/>
								<span className="truncate">
									Your account is temporarily suspended from
									posting
								</span>
							</span>
						) : (
							<p
								className="
                                    truncate
                                    text-[14px]
                                    text-slate-400
                                    transition-colors
                                    duration-300
                                    group-hover:text-slate-300
                                "
							>
								{isReview
									? `Share your review on ${bookTitle}...`
									: `Share your analysis on ${bookTitle}...`}
							</p>
						)}
					</div>

					{/* ACTION ICON */}
					<div
						className={`
                            ml-3
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-full
                            transition-all
                            duration-300
                            ${
								isSuspended
									? "text-red-400/50"
									: isReview
										? "text-blue-300 group-hover:bg-blue-500/10"
										: "text-indigo-300 group-hover:bg-indigo-500/10"
							}
                        `}
					>
						{isSuspended ? (
							// Ganti ke ikon Gembok milik Lucide React jika user di-suspend
							<Lock size={13} />
						) : isReview ? (
							<MessageSquareText size={14} />
						) : (
							<BarChart3 size={14} />
						)}
					</div>
				</div>
			</motion.button>
		</div>
	);
}
