"use client";

import { motion } from "framer-motion";
import { usePostModal } from "@/stores/postModal";

export default function CreatePostBox() {
	const open = usePostModal((state) => state.open);
	
	return (
		<motion.div
			onClick={() => open("review")}
			whileHover={{ scale: 1.01 }}
			whileTap={{ scale: 0.99 }}
			className="
				bg-gradient-to-b from-gray-800/80 to-gray-900/80
				backdrop-blur-md
				border border-gray-700/60
				rounded-2xl
				p-4
				cursor-pointer
				transition-all duration-200
				shadow-[0_4px_20px_rgba(0,0,0,0.3)]
				hover:border-gray-600
			"
		>
			<div className="flex items-center gap-3">
				{/* Avatar */}
				<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
					A
				</div>

				{/* Fake input with send icon */}
				<div className="flex-1 relative">
					<div
						className="
							bg-gray-800/60
							border border-gray-700
							rounded-full
							pl-4 pr-10 py-2
							text-sm text-gray-400
							transition-all duration-200
							hover:bg-gray-800
							hover:border-gray-600
						"
					>
						Share your thoughts about a book...
					</div>

					{/* Send Icon */}
					<div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-400 transition">
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
					</div>
				</div>
			</div>
		</motion.div>
	);
}
