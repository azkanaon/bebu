"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { followUserAPI, unfollowUserAPI } from "@/lib/api";
import { formatCompactNumber } from "@/lib/utils";

type User = {
	id: number;
	name: string;
	username: string;
	avatar: string;
	verified?: boolean;
	mutualUsers?: string[];
	bio?: string;
	total_followers: number;
	total_following: number;
};

export function FriendRecommendation() {
	const [users, setUsers] = useState<User[]>([]);
	const [hovered, setHovered] = useState<number | null>(null);
	const [followStatus, setFollowStatus] = useState<Record<number, string>>(
		{},
	);

	useEffect(() => {
		fetch("http://localhost:8080/api/v1/users/recommendation")
			.then((res) => res.json())
			.then((data) =>
				setUsers(
					(Array.isArray(data) ? data : []).map((u: User) => ({
						...u,
						verified: Math.random() > 0.7,
						mutualUsers: ["Alice", "Bob", "Charlie"].slice(
							0,
							Math.floor(Math.random() * 3) + 1,
						),
					})),
				),
			);
	}, []);

	const toggleFollow = async (user: User) => {
		const currentStatus = followStatus[user.id];

		try {
			// Jika sudah follow atau sedang pending, maka UNFOLLOW
			if (currentStatus === "accepted" || currentStatus === "pending") {
				await unfollowUserAPI(user.username);

				// Hapus status dari state agar tombol kembali jadi "Follow"
				setFollowStatus((prev) => {
					const newState = { ...prev };
					delete newState[user.id];
					return newState;
				});
				console.log(`Berhasil unfollow ${user.username}`);
			}
			// Jika belum follow, maka FOLLOW
			else {
				const res = await followUserAPI(user.username);

				setFollowStatus((prev) => ({
					...prev,
					[user.id]: res.status, // "accepted" atau "pending"
				}));
			}
		} catch (err) {
			console.error("Follow error:", err);
		}
	};
	const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(
		null,
	);

	return (
		<div className="bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 rounded-2xl border border-white/10 shadow-lg">
			<h2 className="font-semibold text-lg text-white mb-4">
				👤 Who to follow
			</h2>

			<div className="space-y-3">
				{users.map((u) => {
					const MAX_VISIBLE = 2;
					const currentStatus = followStatus[u.id];

					const visibleMutuals =
						u.mutualUsers?.slice(0, MAX_VISIBLE) || [];
					const remaining =
						(u.mutualUsers?.length || 0) - MAX_VISIBLE;

					return (
						<div key={u.id} className="relative">
							{/* CARD */}
							<motion.div
								onMouseEnter={() => {
									if (hoverTimeout)
										clearTimeout(hoverTimeout);
									setHovered(u.id);
								}}
								onMouseLeave={() => {
									const t = setTimeout(() => {
										setHovered(null);
									}, 80); // kecil aja biar smooth
									setHoverTimeout(t);
								}}
								whileHover={{ y: -3 }}
								className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
							>
								<div className="flex items-center gap-3">
									<Image
										src={
											u.avatar ||
											`https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`
										}
										alt={u.name}
										width={44}
										height={44}
										className="rounded-full border border-white/20"
									/>

									<div>
										<div className="flex items-center gap-1">
											<p className="text-sm font-semibold text-white max-w-[100px] truncate">
												{u.name}
											</p>
										</div>

										<p className="text-xs text-gray-400 max-w-[90px] truncate">
											@{u.username}
										</p>

										{/* MUTUAL AVATARS */}
										<div className="flex items-center mt-1">
											<div className="flex -space-x-2">
												{visibleMutuals.map((m, i) => (
													<div
														key={i}
														className="w-6 h-6 rounded-full bg-gray-600 border-1 border-white/10 text-[10px] flex items-center justify-center font-medium text-white"
													>
														{m[0]}
													</div>
												))}

												{remaining > 0 && (
													<div className="w-6 h-6 rounded-full bg-white/10 border-1 border-white/10 text-[10px] flex items-center justify-center text-gray-300">
														+{remaining}
													</div>
												)}
											</div>

											{/* optional label */}
											<span className="text-[11px] text-gray-400 ml-2">
												{u.mutualUsers?.length} mutual
											</span>
										</div>
									</div>
								</div>

								{/* FOLLOW BUTTON */}
								<motion.button
									key={u.id}
									onClick={() => toggleFollow(u)}
									className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
										currentStatus === "accepted"
											? "bg-white/10 text-white border border-white/20"
											: currentStatus === "pending"
												? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
												: "bg-white text-black"
									}`}
								>
									<span className="relative z-10">
										{currentStatus === "accepted"
											? "Following"
											: currentStatus === "pending"
												? "Pending"
												: "Follow"}
									</span>
								</motion.button>
							</motion.div>

							{/* 🔥 POPOVER */}
							<AnimatePresence>
								{hovered === u.id && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 10 }}
										className="absolute left-0 top-full mt-2 w-64 p-4 rounded-xl bg-[#020617] border border-white/10 shadow-xl z-50 pointer-events-none"
									>
										<div className="flex items-center gap-3">
											<Image
												src={
													u.avatar ||
													`https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`
												}
												alt={u.name}
												width={50}
												height={50}
												className="rounded-full"
											/>

											<div>
												<p className="text-white font-semibold max-w-[140px] truncate">
													{u.name}
												</p>
												<p className="text-gray-400 text-sm max-w-[140px] truncate">
													@{u.username}
												</p>
											</div>
										</div>

										<p className="text-xs text-gray-400 mt-2">
											{u.bio}
										</p>

										<div className="flex justify-between text-xs text-gray-400 mt-3">
											<span>
												<b className="text-white">
													{formatCompactNumber(
														u.total_following,
													)}
												</b>{" "}
												Following
											</span>
											<span>
												<b className="text-white">
													{formatCompactNumber(
														u.total_followers,
													)}
												</b>{" "}
												Followers
											</span>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					);
				})}
			</div>
		</div>
	);
}
