"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { getFriendRecommendationsAPI } from "@/lib/api";
import { useFollowUser } from "@/api/profile/useFollowUser";
import { useUnfollowUser } from "@/api/profile/useUnfollowUser";
import { formatCompactNumber } from "@/lib/utils";
import { FriendRecommendationItem } from "@/types/user";
import { UserProfileResponse } from "@/types/profile";
import { FaCheck } from "react-icons/fa";

export function FriendRecommendation() {
	const [users, setUsers] = useState<FriendRecommendationItem[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [hovered, setHovered] = useState<number | null>(null);
	const [followStatus, setFollowStatus] = useState<Record<number, string>>(
		{},
	);
	const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(
		null,
	);

	const queryClient = useQueryClient();
	const { mutate: followUser, isPending: isFollowPending } = useFollowUser();
	const { mutate: unfollowUser, isPending: isUnfollowPending } =
		useUnfollowUser();

	const isActionPending = isFollowPending || isUnfollowPending;

	// Fetch data rekomendasi asli dari BE Scoring System
	useEffect(() => {
		const fetchRecommendations = async () => {
			try {
				setIsLoading(true);
				const data = await getFriendRecommendationsAPI();
				setUsers(data || []);
			} catch (error) {
				console.error("Gagal memuat rekomendasi teman:", error);
				setUsers([]);
			} finally {
				setIsLoading(false);
			}
		};

		fetchRecommendations();
	}, []);

	const toggleFollow = (user: FriendRecommendationItem) => {
		if (isActionPending) return;

		const currentStatus = followStatus[user.id];

		// Skenario 1: Jika sudah follow atau sedang pending, maka UNFOLLOW
		if (currentStatus === "accepted" || currentStatus === "pending") {
			unfollowUser(user.username, {
				onSuccess: () => {
					// 1. Hapus status dari state lokal komponen
					setFollowStatus((prev) => {
						const newState = { ...prev };
						delete newState[user.id];
						return newState;
					});

					// 2. Sinkronisasi global cache React Query untuk ProfileHeader (jika sedang dibuka)
					queryClient.setQueryData(
						["profile", user.username],
						(oldData: UserProfileResponse | undefined) => {
							if (!oldData) return oldData;
							return {
								...oldData,
								stats: {
									...oldData.stats,
									totalFollowers: oldData.viewerContext
										?.isFollowing
										? Math.max(
												oldData.stats.totalFollowers -
													1,
												0,
											)
										: oldData.stats.totalFollowers,
								},
								viewerContext: oldData.viewerContext
									? {
											...oldData.viewerContext,
											isFollowing: false,
											isPending: false,
										}
									: undefined,
							};
						},
					);
					queryClient.invalidateQueries({
						queryKey: ["followers", user.username],
					});
				},
			});
			return;
		}

		// Skenario 2: Jika belum follow, maka FOLLOW
		followUser(user.username, {
			onSuccess: (response) => {
				// 1. Update status di state lokal berdasarkan respons backend ('accepted' atau 'pending')
				setFollowStatus((prev) => ({
					...prev,
					[user.id]: response.status,
				}));

				// 2. Sinkronisasi global cache React Query untuk ProfileHeader
				queryClient.setQueryData(
					["profile", user.username],
					(oldData: UserProfileResponse | undefined) => {
						if (!oldData) return oldData;
						return {
							...oldData,
							stats: {
								...oldData.stats,
								totalFollowers:
									response.status === "accepted"
										? oldData.stats.totalFollowers + 1
										: oldData.stats.totalFollowers,
							},
							viewerContext: oldData.viewerContext
								? {
										...oldData.viewerContext,
										isFollowing:
											response.status === "accepted",
										isPending:
											response.status === "pending",
									}
								: undefined,
						};
					},
				);
				if (response.status === "accepted") {
					queryClient.invalidateQueries({
						queryKey: ["followers", user.username],
					});
				}
			},
		});
	};

	// 1. TAMPILAN LOADING SKELETON
	if (isLoading) {
		return (
			<div className="bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 rounded-2xl border border-white/10 shadow-lg animate-pulse">
				<div className="h-6 w-36 bg-gray-800 rounded mb-4" />
				<div className="space-y-3">
					{[...Array(4)].map((_, i) => (
						<div
							key={i}
							className="h-[70px] w-full bg-white/5 rounded-xl border border-white/5"
						/>
					))}
				</div>
			</div>
		);
	}

	// 2. JIKA TIDAK ADA DATA REKOMENDASI
	if (users.length === 0) return null;

	return (
		<div className="bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 rounded-2xl border border-white/10 shadow-lg">
			<h2 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
				👥 Who to follow
			</h2>

			<div className="space-y-3">
				{users.map((u) => {
					const currentStatus = followStatus[u.id];

					return (
						<div key={u.id} className="relative">
							{/* CARD PEMBUNGKUS */}
							<motion.div
								onMouseEnter={() => {
									if (hoverTimeout)
										clearTimeout(hoverTimeout);
									setHovered(u.id);
								}}
								onMouseLeave={() => {
									const t = setTimeout(() => {
										setHovered(null);
									}, 120);
									setHoverTimeout(t);
								}}
								whileHover={{ y: -2 }}
								className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
							>
								{/* Link navigasi profil */}
								<Link
									href={`/${u.username}`}
									className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
								>
									<Image
										src={
											u.avatar ||
											`https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`
										}
										alt={u.name}
										width={40}
										height={40}
										className="rounded-full border border-white/20 object-cover flex-shrink-0"
									/>

									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-1">
											<p className="text-xs font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
												{u.name}
											</p>
										</div>

										<p className="text-[10px] text-gray-400 truncate">
											@{u.username}
										</p>

										{u.bio && (
											<p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5 italic">
												&quot;{u.bio}&quot;
											</p>
										)}
									</div>
								</Link>

								{/* FOLLOW BUTTON */}
								<motion.button
									key={u.id}
									onClick={(e) => {
										e.preventDefault();
										toggleFollow(u);
									}}
									disabled={isActionPending}
									className={`px-3 py-1.5 text-[11px] rounded-full font-medium transition-all ml-2 flex-shrink-0 cursor-pointer ${
										currentStatus === "accepted"
											? "bg-white/10 text-white border border-white/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"
											: currentStatus === "pending"
												? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
												: "bg-white text-black hover:bg-white/90"
									}`}
								>
									<span className="relative z-10 flex items-center gap-1">
										{currentStatus === "accepted" ? (
											<>
												<FaCheck
													size={10}
													className="inline group-hover:hidden"
												/>
												<span className="group-hover:block">
													Following
												</span>
											</>
										) : currentStatus === "pending" ? (
											"Requested"
										) : (
											"Follow"
										)}
									</span>
								</motion.button>
							</motion.div>

							{/* POPOVER PROFIL DETAIL */}
							<AnimatePresence>
								{hovered === u.id && (
									<motion.div
										initial={{ opacity: 0, y: 6 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 6 }}
										className="absolute left-0 top-full mt-2 w-64 p-4 rounded-xl bg-[#020617] border border-white/10 shadow-xl z-50 pointer-events-none"
									>
										<div className="flex items-center gap-3">
											<Image
												src={
													u.avatar ||
													`https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`
												}
												alt={u.name}
												width={46}
												height={46}
												className="rounded-full object-cover"
											/>

											<div className="min-w-0 flex-1">
												<p className="text-white text-xs font-semibold truncate">
													{u.name}
												</p>
												<p className="text-gray-400 text-[11px] truncate">
													@{u.username}
												</p>
											</div>
										</div>

										{u.bio && (
											<p className="text-[11px] text-gray-400 mt-2.5 line-clamp-2 bg-white/[0.02] p-2 rounded-lg border border-white/5">
												{u.bio}
											</p>
										)}

										<div className="flex justify-between text-[11px] text-gray-400 mt-3 px-1">
											<span>
												<b className="text-white font-semibold">
													{formatCompactNumber(
														u.total_following || 0,
													)}
												</b>{" "}
												Following
											</span>
											<span>
												<b className="text-white font-semibold">
													{formatCompactNumber(
														u.total_followers || 0,
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
