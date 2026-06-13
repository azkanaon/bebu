"use client";

import { motion } from "framer-motion";
import { usePostModal } from "@/stores/postModal";
import { useAuthStore } from "@/stores/useAuthStore";
import UserAvatar from "@/components/UserAvatar";

export default function CreatePostBox() {
	const open = usePostModal((state) => state.open);
	const { user } = useAuthStore();

	const isSuspended = user?.status === "suspended";

	const handleBoxClick = () => {
		if (isSuspended) return;
		open("review");
	};

	return (
		<motion.div
			onClick={handleBoxClick}
			// Tetap berikan animasi mikro saat di-hover/tap untuk kenyamanan UX,
			// namun jika suspended kita matikan efek scale-up nya.
			whileHover={!isSuspended ? { scale: 1.01 } : { scale: 1.002 }}
			whileTap={!isSuspended ? { scale: 0.99 } : {}}
			className={`
                bg-gradient-to-b from-gray-800/80 to-gray-900/80
                backdrop-blur-md
                rounded-2xl
                p-4
                transition-all duration-300
                shadow-[0_4px_20px_rgba(0,0,0,0.3)]
                ${
					isSuspended
						? "cursor-not-allowed border border-red-500/50 bg-gradient-to-b from-red-950/20 to-gray-900/90 shadow-[inset_0_1px_2px_rgba(239,68,68,0.1)]"
						: "cursor-pointer border border-gray-700/60 hover:border-gray-600 hover:shadow-[0_4px_25px_rgba(0,0,0,0.4)]"
				}
            `}
		>
			<div className="flex items-center gap-3">
				{/* Avatar */}
				<UserAvatar
					user={user}
					size={40}
					// Jika suspended, berikan sedikit filter grayscale pada avatar agar mendukung tema 'restricted'
					className={`border shadow-md transition-all ${isSuspended ? "border-red-500/30 grayscale-[30%]" : "border-white/20"}`}
				/>

				{/* Fake input window */}
				<div className="flex-1 relative">
					<div
						className={`
                            border 
                            rounded-full
                            pl-4 pr-12 py-2.5
                            text-sm 
                            font-medium
                            transition-all duration-300
                            ${
								isSuspended
									? "bg-red-500/5 border-red-500/20 text-red-400 select-none"
									: "bg-gray-800/60 border-gray-700 text-gray-400 hover:bg-gray-800 hover:border-gray-600"
							}
                        `}
					>
						{isSuspended ? (
							<span className="flex items-center gap-2">
								{/* Icon Warning Kecil */}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
									className="w-4 h-4 text-red-400 shrink-0"
								>
									<path
										fillRule="evenodd"
										d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
										clipRule="evenodd"
									/>
								</svg>
								Your account is temporarily suspended from
								posting
							</span>
						) : (
							"Share your thoughts about a book..."
						)}
					</div>

					{/* Right Action / Lock Icon */}
					<div
						className={`
                            absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300
                            ${isSuspended ? "text-red-400/60" : "text-gray-500 hover:text-blue-400"}
                        `}
					>
						{isSuspended ? (
							// Ubah Icon Send menjadi Icon Gembok (Lock) agar secara psikologis user tahu ini terkunci
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								className="w-4 h-4"
							>
								<path
									fillRule="evenodd"
									d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
									clipRule="evenodd"
								/>
							</svg>
						) : (
							// Icon Send Original Anda
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.8}
								stroke="currentColor"
								className="w-5 h-5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M6 12 3 3l18 9-18 9 3-9Z"
								/>
							</svg>
						)}
					</div>
				</div>
			</div>
		</motion.div>
	);
}
