"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type User = {
	id: number;
	name: string;
	username: string;
	avatar: string;
	verified?: boolean;
	mutualUsers?: string[];
};

export function FriendRecommendation() {
	const [users, setUsers] = useState<User[]>([]);
	const [following, setFollowing] = useState<number[]>([]);
	const [hovered, setHovered] = useState<number | null>(null);

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

	const toggleFollow = (id: number) => {
		setFollowing((prev) =>
			prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
		);
	};

	return (
		<div className="bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 rounded-2xl border border-white/10 shadow-lg">
			<h2 className="font-semibold text-lg text-white mb-4">
				👤 Who to follow
			</h2>

			<div className="space-y-3">
				{users.map((u) => {
					const isFollowing = following.includes(u.id);
					const MAX_VISIBLE = 2;

					const visibleMutuals =
						u.mutualUsers?.slice(0, MAX_VISIBLE) || [];
					const remaining =
						(u.mutualUsers?.length || 0) - MAX_VISIBLE;

					return (
						<div
							key={u.id}
							className="relative"
							onMouseEnter={() => setHovered(u.id)}
							onMouseLeave={() => setHovered(null)}
						>
							{/* CARD */}
							<motion.div
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
									onClick={() => toggleFollow(u.id)}
									whileTap={{ scale: 0.9 }}
									className={`relative overflow-hidden px-3 py-1.5 text-xs rounded-full font-medium ${
										isFollowing
											? "bg-white/10 text-white border border-white/20"
											: "bg-white text-black"
									}`}
								>
									{/* ripple */}
									<motion.span
										initial={{ scale: 0, opacity: 0.5 }}
										animate={{ scale: 2, opacity: 0 }}
										transition={{ duration: 0.6 }}
										className="absolute inset-0 bg-white rounded-full"
									/>

									<span className="relative z-10">
										{isFollowing ? "Following" : "Follow"}
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
										className="absolute left-0 top-full mt-2 w-64 p-4 rounded-xl bg-[#020617] border border-white/10 shadow-xl z-50"
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
											Lorem ipsum bio user. Passionate
											reader & writer.
										</p>

										<div className="flex justify-between text-xs text-gray-400 mt-3">
											<span>
												<b className="text-white">
													123
												</b>{" "}
												Following
											</span>
											<span>
												<b className="text-white">
													1.2K
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
