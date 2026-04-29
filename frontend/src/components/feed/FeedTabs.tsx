"use client";

import { motion } from "framer-motion";

type Props = {
	tab: "recommended" | "following";
	setTab: (tab: "recommended" | "following") => void;
};

export default function FeedTabs({ tab, setTab }: Props) {
	return (
		<div className="sticky top-0 z-50 backdrop-blur-md bg-gray-900/70 border-b border-gray-800">
			<div className="relative grid grid-cols-2">
				{/* 🔥 Background sliding indicator */}
				<motion.div
					initial={false}
					animate={{
						x: tab === "recommended" ? "0%" : "100%",
					}}
					transition={{ type: "spring", stiffness: 400, damping: 30 }}
					className="absolute top-0 left-0 w-1/2 h-full"
				>
					<div className="h-full w-full bg-gray-800/60" />
				</motion.div>

				{/* 🔥 Tabs */}
				<button
					onClick={() => setTab("recommended")}
					className={`relative py-3 text-sm font-medium transition-colors duration-200
						${tab === "recommended" ? "text-white" : "text-gray-400 hover:text-gray-200"}
					`}
				>
					Recommended
				</button>

				<button
					onClick={() => setTab("following")}
					className={`relative py-3 text-sm font-medium transition-colors duration-200
						${tab === "following" ? "text-white" : "text-gray-400 hover:text-gray-200"}
					`}
				>
					Following
				</button>

				{/* 🔥 Underline (FIXED version, no layoutId) */}
				<motion.div
					className="absolute bottom-0 left-0 h-[2px] w-1/2 bg-blue-500"
					initial={false}
					animate={{
						x: tab === "recommended" ? "0%" : "100%",
					}}
					transition={{ type: "spring", stiffness: 400, damping: 30 }}
				/>
			</div>
		</div>
	);
}
