"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "@/components/UserAvatar";
import { getLeaderboardAPI } from "@/lib/api";
import { LeaderboardUser, TabType } from "@/types/leaderboard";

export function Leaderboard() {
	const [users, setUsers] = useState<LeaderboardUser[]>([]);
	const [myRank, setMyRank] = useState<LeaderboardUser | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<TabType>("all_time");

	useEffect(() => {
		setLoading(true);
		getLeaderboardAPI(activeTab, 5)
			.then((res) => {
				setUsers(Array.isArray(res.data) ? res.data : []);
				setMyRank(res.my_rank);
			})
			.catch(() => {
				setUsers([]);
				setMyRank(null);
			})
			.finally(() => setLoading(false));
	}, [activeTab]);

	const getRankStyle = (rank: number) => {
		if (rank === 1)
			return "bg-yellow-400/20 text-yellow-300 border-yellow-400/40";
		if (rank === 2)
			return "bg-gray-300/20 text-gray-200 border-gray-300/40";
		if (rank === 3)
			return "bg-orange-400/20 text-orange-300 border-orange-400/40";
		return "bg-white/5 text-gray-300 border-white/10";
	};

	return (
		<div className="bg-right-bar p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col max-h-[550px]">
			<h2 className="font-semibold text-lg text-white mb-3 flex items-center gap-2">
				🏆 Leaderboard
			</h2>

			{/* 🔥 FULL WIDTH TAB */}
			<div className="relative flex w-full bg-white/5 rounded-lg p-1 mb-4 select-none">
				{/* sliding indicator */}
				<motion.div
					className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-md"
					initial={false}
					animate={{
						x: activeTab === "all_time" ? 0 : "100%",
					}}
					transition={{ type: "spring", stiffness: 300, damping: 30 }}
				/>

				<button
					onClick={() => setActiveTab("all_time")}
					className={`relative z-10 w-1/2 text-sm py-1.5 transition-colors duration-200 ${
						activeTab === "all_time"
							? "text-black font-medium"
							: "text-gray-400"
					}`}
				>
					All-time
				</button>

				<button
					onClick={() => setActiveTab("monthly")}
					className={`relative z-10 w-1/2 text-sm py-1.5 transition-colors duration-200 ${
						activeTab === "monthly"
							? "text-black font-medium"
							: "text-gray-400"
					}`}
				>
					Monthly
				</button>
			</div>

			{/* 🔥 ANIMATED CONTENT LIST */}
			<div className="flex-1 overflow-y-auto no-scrollbar gap-2 flex flex-col pr-1 mb-2">
				{loading ? (
					<p className="text-sm text-gray-400 animate-pulse p-2">
						Loading...
					</p>
				) : users.length === 0 ? (
					<p className="text-sm text-gray-400 p-2">
						No rankings data
					</p>
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
									key={u.user_id}
									initial={{ opacity: 0, y: 5 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: i * 0.04 }}
									className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition"
								>
									<div className="flex items-center gap-3 min-w-0">
										<div
											className={`w-8 h-8 flex items-center justify-center rounded-full border text-sm font-bold flex-shrink-0 ${getRankStyle(
												u.rank,
											)}`}
										>
											{u.rank}
										</div>
										<UserAvatar
											user={{ avatar_url: u.avatar_url }}
											size={40}
											className="border-2 border-white/10 flex-shrink-0"
										/>

										<div className="min-w-0">
											<p className="text-sm text-white font-medium truncate max-w-[120px]">
												{u.display_name || u.username}
											</p>
											<p className="text-xs text-gray-400 truncate max-w-[110px]">
												@{u.username}
											</p>
										</div>
									</div>

									<div className="text-yellow-400 font-semibold text-sm pl-2 flex-shrink-0">
										{u.total_exp.toLocaleString("id-ID")}{" "}
										<span className="text-[10px] text-gray-400 font-normal">
											XP
										</span>
									</div>
								</motion.div>
							))}
						</motion.div>
					</AnimatePresence>
				)}
			</div>

			{/* 🎯 STICKY MY RANK WIDGET (Ditampilkan jika user masuk peringkat berapapun) */}
			{!loading && myRank && (
				<div className="mt-2 pt-3 border-t border-white/10 bg-white/5 -mx-4 -mb-4 p-4 rounded-b-2xl">
					<p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5 px-1">
						Peringkat Kamu
					</p>
					<div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
						<div className="flex items-center gap-3 min-w-0">
							<div
								className={`w-8 h-8 flex items-center justify-center rounded-full border text-sm font-bold flex-shrink-0 ${getRankStyle(myRank.rank)}`}
							>
								{myRank.rank}
							</div>
							<UserAvatar
								user={{ avatar_url: myRank.avatar_url }}
								size={40}
								className="border-2 border-indigo-500/30"
							/>
							<div className="min-w-0">
								<p className="text-sm text-white font-semibold truncate max-w-[120px]">
									{myRank.display_name || myRank.username}{" "}
									(Anda)
								</p>
								<p className="text-xs text-indigo-300 truncate">
									@{myRank.username}
								</p>
							</div>
						</div>
						<div className="text-yellow-400 font-bold text-sm flex-shrink-0">
							{myRank.total_exp.toLocaleString("id-ID")}{" "}
							<span className="text-[10px] text-gray-400 font-normal">
								XP
							</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
