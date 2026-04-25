"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type User = {
	id: number;
	name: string;
	username: string;
	avatar: string;
	rank: number;
};

type TabType = "all-time" | "monthly";

export function Leaderboard() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<TabType>("all-time");

	useEffect(() => {
		fetch("http://localhost:8080/api/v1/leaderboard")
			.then((res) => res.json())
			.then((data) => setUsers(Array.isArray(data) ? data : []))
			.catch(() => setUsers([]))
			.finally(() => setLoading(false));
	}, [activeTab]); // nanti tinggal beda endpoint

	const getRankStyle = (index: number) => {
		if (index === 0)
			return "bg-yellow-400/20 text-yellow-300 border-yellow-400/40";
		if (index === 1)
			return "bg-gray-300/20 text-gray-200 border-gray-300/40";
		if (index === 2)
			return "bg-orange-400/20 text-orange-300 border-orange-400/40";
		return "bg-white/5 text-gray-300 border-white/10";
	};

	return (
		<div className="bg-right-bar p-4 rounded-2xl border border-white/10 shadow-lg">
			<h2 className="font-semibold text-lg text-white mb-3">
				🏆 Leaderboard
			</h2>

			{/* 🔥 FULL WIDTH TAB */}
			<div className="relative flex w-full bg-white/5 rounded-lg p-1 mb-4">
				{/* sliding indicator */}
				<motion.div
					layout
					className="absolute top-1 bottom-1 w-1/2 bg-white rounded-md"
					initial={false}
					animate={{
						x: activeTab === "all-time" ? "0%" : "100%",
					}}
					transition={{ type: "spring", stiffness: 300, damping: 30 }}
				/>

				<button
					onClick={() => setActiveTab("all-time")}
					className={`relative z-10 w-1/2 text-sm py-1.5 transition ${
						activeTab === "all-time"
							? "text-black font-medium"
							: "text-gray-400"
					}`}
				>
					All-time
				</button>

				<button
					onClick={() => setActiveTab("monthly")}
					className={`relative z-10 w-1/2 text-sm py-1.5 transition ${
						activeTab === "monthly"
							? "text-black font-medium"
							: "text-gray-400"
					}`}
				>
					Monthly
				</button>
			</div>

			{/* 🔥 ANIMATED CONTENT */}
			{loading ? (
				<p className="text-sm text-gray-400">Loading...</p>
			) : users.length === 0 ? (
				<p className="text-sm text-gray-400">No data</p>
			) : (
				<AnimatePresence mode="wait">
					<motion.div
						key={activeTab}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.25 }}
						className="flex flex-col gap-2"
					>
						{users.map((u, i) => (
							<motion.div
								key={u.id}
								initial={{ opacity: 0, y: 5 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: i * 0.05 }}
								className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition"
							>
								<div className="flex items-center gap-3">
									<div
										className={`w-8 h-8 flex items-center justify-center rounded-full border text-sm font-bold ${getRankStyle(
											i,
										)}`}
									>
										{u.rank}
									</div>

									<Image
										src={
											u.avatar ||
											`https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`
										}
										alt={u.name}
										width={40}
										height={40}
										className="rounded-full object-cover border-2 border-white/30"
									/>

									<div>
										<p className="text-sm text-white font-medium max-w-[100px] truncate">
											{u.name}
										</p>
										<p className="text-xs text-gray-400 max-w-[90px] truncate">
											@{u.username}
										</p>
									</div>
								</div>

								<div className="text-yellow-300 text-sm">
									1,000
								</div>
							</motion.div>
						))}
					</motion.div>
				</AnimatePresence>
			)}
		</div>
	);
}
