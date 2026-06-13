"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePostStore } from "@/stores/usePostStore";
import { ReviewPostType, CommentType } from "@/types/post";
import {
	ThumbsUp,
	MessageCircle,
	Share2,
	Bookmark,
	MoreVertical,
	Trash2,
	Flag,
	AlertTriangle,
	Lock, // 🔥 Tambahkan ikon gembok untuk indikator proteksi
} from "lucide-react";
import PostMenu from "./PostMenu";
import {
	toggleLikeAPI,
	toggleSaveAPI,
	createCommentAPI,
	deleteCommentAPI,
} from "@/lib/api";
import { useState, useEffect } from "react";
import CommentModal from "./CommentModal";
import ShareModal from "./ShareModal";
import { timeAgo } from "@/lib/utils";
import ReportModal from "./ReportModal";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import BookCover from "@/components/BookCover";

type Props = {
	post: ReviewPostType;
	isModalView?: boolean;
	disableCommentLink?: boolean;
};

const MotionLink = motion(Link);

export default function ReviewPost({
	post,
	isModalView = false,
	disableCommentLink = false,
}: Props) {
	const [isLoading, setIsLoading] = useState(false);

	const {
		interactions,
		initPost,
		toggleLikeStore,
		toggleSaveStore,
		addShareCountStore,
	} = usePostStore();

	useEffect(() => {
		initPost(post.id, {
			likes: post.likes,
			is_liked: post.is_liked,
			is_saved: post.is_saved,
			shares: post.shares,
		});
	}, [post.id]);

	const currentData = interactions[post.id] || {
		likes: post.likes,
		is_liked: post.is_liked,
		is_saved: post.is_saved,
		shares: post.shares,
	};

	// 🔥 Ambil data auth untuk pengecekan status akun ter-suspend
	const authStorage =
		typeof window !== "undefined"
			? localStorage.getItem("bebu-auth-storage")
			: null;
	const parsedStorage = authStorage ? JSON.parse(authStorage) : null;
	const user = parsedStorage?.state?.user;
	const currentUserId = user?.user_public_id;

	const isSuspended = user?.status === "suspended";

	const handleLike = async () => {
		if (isLoading || isSuspended) return; // 🔥 Kunci interaksi like

		toggleLikeStore(post.id);

		setIsLoading(true);
		try {
			await toggleLikeAPI(Number(post.id));
		} catch (error) {
			toggleLikeStore(post.id);
			console.error("Like failed:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const [isSaveLoading, setIsSaveLoading] = useState(false);

	const handleSave = async () => {
		if (isSaveLoading || isSuspended) return; // 🔥 Kunci interaksi save

		toggleSaveStore(post.id);

		setIsSaveLoading(true);
		try {
			await toggleSaveAPI(Number(post.id));
		} catch (error) {
			toggleSaveStore(post.id);
			console.error("Save failed:", error);
		} finally {
			setIsSaveLoading(false);
		}
	};

	const [showComments, setShowComments] = useState(false);
	const [commentText, setCommentText] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [localCommentsCount, setLocalCommentsCount] = useState(post.comments);
	const [localCommentList, setLocalCommentList] = useState(
		post.comment_list || [],
	);

	const handlePostComment = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!commentText.trim() || isSubmitting || isSuspended) return; // 🔥 Kunci interaksi submit comment

		setIsSubmitting(true);
		try {
			const payload = {
				post_id: post.id,
				parent_comment_id: null,
				comment: commentText,
			};

			const response = await createCommentAPI(payload);
			const newComment = response.data;

			setLocalCommentsCount((prev) => prev + 1);
			setLocalCommentList((prev) => [newComment, ...prev].slice(0, 2));

			setCommentText("");
		} catch (error) {
			console.error("Gagal kirim komentar:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const [isShareOpen, setIsShareOpen] = useState(false);

	const handleShareSuccess = (count: number) => {
		addShareCountStore(post.id, count);
	};

	// Change rating color sesuai rating number
	const getRatingStyle = (rating: number) => {
		if (rating >= 4.5) {
			return {
				bg: "bg-cyan-500/10",
				border: "border-cyan-400/20",
				text: "text-cyan-300",
				glow: "shadow-[0_0_18px_rgba(34,211,238,0.12)]",
			};
		}

		if (rating >= 4.0) {
			return {
				bg: "bg-emerald-500/10",
				border: "border-emerald-400/20",
				text: "text-emerald-300",
				glow: "shadow-[0_0_18px_rgba(74,222,128,0.10)]",
			};
		}

		if (rating >= 3.0) {
			return {
				bg: "bg-yellow-500/10",
				border: "border-yellow-400/20",
				text: "text-yellow-300",
				glow: "shadow-[0_0_18px_rgba(250,204,21,0.10)]",
			};
		}

		if (rating >= 2.0) {
			return {
				bg: "bg-orange-500/10",
				border: "border-orange-400/20",
				text: "text-orange-300",
				glow: "shadow-[0_0_18px_rgba(251,146,60,0.10)]",
			};
		}

		return {
			bg: "bg-red-500/10",
			border: "border-red-400/20",
			text: "text-red-300",
			glow: "shadow-[0_0_18px_rgba(248,113,113,0.10)]",
		};
	};

	const ratingStyle = getRatingStyle(post.book.rating);

	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
	const [openMenuId, setOpenMenuId] = useState<number | null>(null);

	const handleDelete = async (commentId: number, postId: number) => {
		if (isSuspended) return; // 🔥 Kunci interaksi hapus komentar
		const previousComments = localCommentList;
		const previousCount = localCommentsCount;

		try {
			setLocalCommentList((prev) => {
				const removeRecursive = (
					list: CommentType[],
				): CommentType[] => {
					return list
						.filter((c) => c.id !== commentId)
						.map((c) => ({
							...c,
							replies: removeRecursive(c.replies || []),
						}));
				};
				return removeRecursive(prev);
			});

			setLocalCommentsCount((prev) => Math.max(prev - 1, 0));
			setOpenMenuId(null);

			const response = await deleteCommentAPI(commentId, postId);

			const actualDeleted = response?.deleted_count;
			if (actualDeleted > 1) {
				const remainingToReduce = actualDeleted - 1;
				setLocalCommentsCount((prev) =>
					Math.max(prev - remainingToReduce, 0),
				);
			}
		} catch (err) {
			console.error("Gagal menghapus:", err);
			setLocalCommentList(previousComments);
			setLocalCommentsCount(previousCount);
			alert("Gagal menghapus komentar.");
		}
	};

	const [reportTarget, setReportTarget] = useState<{
		id: number;
		type: "post" | "comment";
	} | null>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;

			if (target.closest("[data-comment-menu]")) {
				return;
			}

			setOpenMenuId(null);
			setConfirmDeleteId(null);
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const commentButtonContent = (
		<motion.button
			whileTap={disableCommentLink || isSuspended ? {} : { scale: 0.97 }}
			className={`
				flex items-center gap-1.5
				px-2 py-1.5
				rounded-full
				text-gray-500
				transition-all duration-200
				${disableCommentLink || isSuspended ? "cursor-default" : "cursor-pointer hover:bg-white/[0.03] hover:text-green-400"} 
			`}
		>
			<MessageCircle size={18} strokeWidth={2.3} />
			<span className="font-medium tabular-nums">{post.comments}</span>
		</motion.button>
	);

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			whileHover={isModalView ? {} : { y: -1.5 }}
			transition={{ duration: 0.2 }}
			className={`
				bg-gradient-to-b from-gray-900 to-gray-950
				border border-gray-800
				rounded-2xl
				p-4
				space-y-3
				shadow-[0_6px_30px_rgba(0,0,0,0.4)]
				${
					isModalView
						? "w-full border-none shadow-none rounded-none"
						: "border border-gray-800 rounded-2xl shadow-[0_6px_30px_rgba(0,0,0,0.4)]"
				}
			`}
		>
			{/* Header */}
			<div className="flex items-start justify-between">
				<Link
					href={`/${post.user.username}`}
					className="flex gap-2.5 cursor-pointer group"
				>
					<UserAvatar
						user={{
							avatar_url: post.user.avatar,
						}}
						size={40}
						className="border border-white/20 transition group-hover:ring-blue-500/50 group-hover:scale-[1.03]"
					/>

					<div>
						<div className="pt-[1px]">
							<div
								className="
									font-semibold text-white leading-snug
									transition-colors
									group-hover:text-blue-400
								"
							>
								{post.user.displayName}
							</div>

							<div className="flex items-center gap-1 text-xs">
								<span className="text-gray-400">
									@{post.user.username}
								</span>

								<span className="text-gray-600">•</span>

								<span className="text-gray-500">
									{timeAgo(post.createdAt)}
								</span>
							</div>
						</div>
					</div>
				</Link>

				<PostMenu
					postId={post.id}
					userPublicID={post.user.publicID}
					postPublicID={post.post_public_id}
				/>
			</div>

			{/* Content */}
			<p className="text-[#d7dbe4] leading-relaxed max-w-[95%] font-[425] antialiased">
				{post.content}
			</p>

			{/* Book Card */}
			<MotionLink
				href={`/books/${post.book.slug}`}
				whileHover={{ y: -1 }}
				transition={{ duration: 0.18 }}
				className="
					relative flex gap-4
					bg-gradient-to-br from-gray-800/70 to-gray-900/80
					border border-gray-700/40
					backdrop-blur-md
					p-3
					rounded-2xl
					overflow-hidden
					cursor-pointer
					block
				"
			>
				<div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.03] to-purple-500/[0.03] pointer-events-none" />
				<div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-white/[0.03] to-transparent pointer-events-none" />
				<div className="absolute inset-0 bg-white/[0.015] pointer-events-none" />

				{/* Cover */}
				<div className="relative shrink-0">
					<BookCover
						src={post.book.cover}
						title={post.book.title}
						width={80}
						height={112}
						className="rounded-lg border border-white/10 ring-1 ring-white/5 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
					/>
				</div>

				{/* Info */}
				<div className="flex-1 min-w-0 space-y-0.5 pr-16">
					<div className="font-semibold tracking-tight text-white text-[15px] leading-snug line-clamp-2">
						{post.book.title}
					</div>

					<div className="text-sm font-medium text-gray-300 truncate">
						{post.book.author}
					</div>

					<div className="text-xs text-gray-500">
						{post.book.pages} halaman
					</div>

					{/* Genres */}
					<div className="flex flex-wrap gap-1.5 pt-1">
						{post.book.genres?.map((g) => (
							<span
								key={g}
								className="text-[11px] bg-gray-700/40 backdrop-blur-sm border border-gray-600/30 px-2 py-[3px] rounded-full text-gray-300"
							>
								{g}
							</span>
						))}
					</div>
				</div>

				{/* Rating */}
				<div
					className={`
						absolute top-4 right-4
						flex items-center gap-1
						px-2.5 py-1
						rounded-full
						backdrop-blur-sm
						border
						text-xs font-semibold
						tabular-nums
						transition-all duration-300
						${ratingStyle.bg}
						${ratingStyle.border}
						${ratingStyle.text}
						${ratingStyle.glow}
						ring-1 ring-white/[0.03]
					`}
				>
					<span className="text-[10px] opacity-80">★</span>
					<span>{post.book.rating.toFixed(1)}</span>
				</div>
			</MotionLink>

			{/* Actions */}
			<div className="flex items-center justify-between">
				<div className="flex gap-1 text-sm">
					{/* Like */}
					<motion.button
						whileTap={isSuspended ? {} : { scale: 0.97 }}
						onClick={handleLike}
						disabled={isLoading || isSuspended}
						className={`
							flex items-center gap-1.5
							px-2 py-1.5
							rounded-full
							transition-all duration-200
							${
								isSuspended
									? "text-gray-600 cursor-not-allowed"
									: currentData.is_liked
										? "text-blue-400 bg-blue-500/10 cursor-pointer hover:bg-white/[0.03]"
										: "text-gray-400 hover:text-blue-400 cursor-pointer hover:bg-white/[0.03]"
							}
						`}
					>
						<ThumbsUp
							size={18}
							strokeWidth={2.3}
							fill={
								currentData.is_liked && !isSuspended
									? "currentColor"
									: "none"
							}
						/>
						<span className="font-medium tabular-nums">
							{currentData.likes}
						</span>
					</motion.button>

					{/* Comment */}
					{disableCommentLink || isSuspended ? (
						commentButtonContent
					) : (
						<Link
							href={`/post/${post.post_public_id}`}
							scroll={false}
							onClick={() => {
								if (typeof window !== "undefined") {
									window.history.replaceState(
										{
											...window.history.state,
											isModalView: true,
										},
										"",
									);
								}
							}}
						>
							{commentButtonContent}
						</Link>
					)}

					{/* Share */}
					<motion.button
						whileTap={isSuspended ? {} : { scale: 0.97 }}
						onClick={() => !isSuspended && setIsShareOpen(true)}
						disabled={isSuspended}
						className={`
							flex items-center gap-1.5
							px-2 py-1.5
							rounded-full
							transition-all duration-200
							${
								isSuspended
									? "text-gray-600 cursor-not-allowed"
									: "text-gray-500 hover:bg-white/[0.03] hover:text-violet-400 cursor-pointer"
							}
						`}
					>
						<Share2 size={18} strokeWidth={2.3} />
						<span className="font-medium tabular-nums">
							{currentData.shares}
						</span>
					</motion.button>
				</div>

				{/* Save */}
				<motion.button
					whileTap={isSuspended ? {} : { scale: 0.95 }}
					onClick={handleSave}
					disabled={isSaveLoading || isSuspended}
					className={`
						p-2 rounded-full
						transition-all duration-200
						${
							isSuspended
								? "text-gray-600 bg-transparent cursor-not-allowed"
								: currentData.is_saved
									? "text-yellow-400 bg-yellow-500/10 shadow-[0_0_16px_rgba(250,204,21,0.10)] cursor-pointer"
									: "text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 cursor-pointer bg-white/[0.02]"
						}
					`}
				>
					<Bookmark
						size={18}
						strokeWidth={2.3}
						fill={
							currentData.is_saved && !isSuspended
								? "currentColor"
								: "none"
						}
					/>
				</motion.button>
			</div>

			{!isModalView && (
				<div className="mt-2 pt-4 border-t border-gray-800 space-y-2">
					{localCommentList?.map((c) => (
						<div
							key={c.id}
							className={`
								group/comment relative
								flex gap-3 items-start
								px-2 pb-1
								rounded-xl
								transition-all duration-200
								hover:bg-white/[0.02]
								${openMenuId === c.id ? "z-50 bg-white/[0.025]" : "z-0"}
							`}
						>
							<UserAvatar
								user={{ avatar_url: c.avatar }}
								size={28}
								className="mt-0.5 ring-1 ring-white/5"
							/>

							<div className="flex-1 min-w-0">
								<div className="flex items-baseline gap-2 flex-wrap">
									<Link
										href={`/${c.username}`}
										className="font-medium text-gray-200 text-sm hover:text-blue-400 transition-colors cursor-pointer"
									>
										@{c.username}
									</Link>

									<span className="text-[11px] text-gray-600">
										{timeAgo(post.createdAt)}
									</span>
								</div>

								<p className="text-sm text-gray-400 leading-relaxed antialiased break-words">
									{c.comment}
								</p>
							</div>

							<div className="absolute top-2 right-1 z-20">
								<div data-comment-menu className="relative">
									<button
										onClick={(e) => {
											e.stopPropagation();
											setOpenMenuId(
												openMenuId === c.id
													? null
													: c.id,
											);
										}}
										className="p-1.5 rounded-full text-gray-600 hover:text-gray-300 hover:bg-white/[0.04] transition-all duration-200"
									>
										<MoreVertical
											size={15}
											strokeWidth={2.2}
										/>
									</button>

									<AnimatePresence>
										{openMenuId === c.id && (
											<motion.div
												onClick={(e) =>
													e.stopPropagation()
												}
												initial={{
													opacity: 0,
													y: -4,
													scale: 0.96,
												}}
												animate={{
													opacity: 1,
													y: 0,
													scale: 1,
												}}
												exit={{
													opacity: 0,
													y: -4,
													scale: 0.96,
												}}
												transition={{ duration: 0.16 }}
												className="absolute right-0 top-9 w-46 z-[999]"
											>
												<div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-gray-900/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
													{String(
														c.user_public_id,
													) ===
													String(currentUserId) ? (
														confirmDeleteId ===
														c.id ? (
															<div className="w-44 p-3 space-y-2">
																<div className="flex items-start gap-2">
																	<div className="mt-[1px] text-red-400">
																		<AlertTriangle
																			size={
																				13
																			}
																			strokeWidth={
																				2.3
																			}
																		/>
																	</div>
																	<div>
																		<p className="text-xs font-medium text-gray-200">
																			Delete
																			Comment?
																		</p>
																		<p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
																			This
																			is
																			Permanent
																			Action!
																		</p>
																	</div>
																</div>

																<div className="flex justify-end">
																	<button
																		onClick={(
																			e,
																		) => {
																			e.stopPropagation();
																			setConfirmDeleteId(
																				null,
																			);
																		}}
																		className="px-2.5 py-1 text-[11px] text-gray-400 hover:text-white transition-colors"
																	>
																		Cancel
																	</button>

																	<button
																		disabled={
																			isSuspended
																		}
																		onClick={() => {
																			handleDelete(
																				c.id,
																				post.id,
																			);
																			setConfirmDeleteId(
																				null,
																			);
																			setOpenMenuId(
																				null,
																			);
																		}}
																		className="px-2.5 py-1 text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
																	>
																		Delete
																	</button>
																</div>
															</div>
														) : (
															<button
																disabled={
																	isSuspended
																}
																onClick={() =>
																	setConfirmDeleteId(
																		c.id,
																	)
																}
																className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
															>
																<Trash2
																	size={13}
																	strokeWidth={
																		2.2
																	}
																/>
																Delete
															</button>
														)
													) : (
														<button
															disabled={
																isSuspended
															}
															onClick={() => {
																if (isSuspended)
																	return; // Proteksi berlapis
																setReportTarget(
																	{
																		id: c.id, // 🔥 Sekaligus perbaikan agar mereferensikan ID Komentar (c.id), bukan c.user_id
																		type: "comment",
																	},
																);
																setOpenMenuId(
																	null,
																);
															}}
															className={`w-full flex items-center px-4 py-2.5 text-xs transition-colors justify-between ${
																isSuspended
																	? "text-red-400/50 bg-red-950/10 cursor-not-allowed"
																	: "text-gray-300 hover:bg-white/[0.04] hover:text-red-400"
															}`}
														>
															<div className="flex items-center gap-2">
																<Flag
																	size={13}
																	strokeWidth={
																		2.2
																	}
																/>
																<span>
																	{isSuspended
																		? "Report Locked"
																		: "Report"}
																</span>
															</div>
															{isSuspended && (
																<Lock
																	size={12}
																	className="text-red-400/40 ml-auto"
																/>
															)}
														</button>
													)}
												</div>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							</div>
						</div>
					))}

					{/* View All Comments */}
					{!disableCommentLink &&
						localCommentsCount > 2 &&
						(isSuspended ? (
							<span className="text-xs font-medium text-gray-600 pl-4 pb-1 text-left block select-none">
								See all {localCommentsCount} comments...
							</span>
						) : (
							<Link
								href={`/post/${post.post_public_id}`}
								scroll={false}
								onClick={() => {
									if (typeof window !== "undefined") {
										window.history.replaceState(
											{
												...window.history.state,
												isModalView: true,
											},
											"",
										);
									}
								}}
							>
								<button className="text-xs font-medium text-gray-400 hover:text-gray-300 transition-colors pl-4 pb-1 text-left">
									See all {localCommentsCount} comments...
								</button>
							</Link>
						))}

					{/* Quick Comment Input */}
					<form
						onSubmit={handlePostComment}
						className="flex items-center gap-3 pt-1"
					>
						<div className="flex-1 relative">
							<input
								disabled={isSubmitting || isSuspended}
								value={commentText}
								onChange={(e) => setCommentText(e.target.value)}
								placeholder={
									isSuspended
										? "Interactions are restricted due to account suspension."
										: isSubmitting
											? "Sending..."
											: "Share your opinion..."
								}
								className={`
									w-full
									backdrop-blur-sm
									rounded-full
									px-4 py-2
									text-sm
									transition-all duration-200
									focus:outline-none
									${
										isSuspended
											? "bg-red-950/10 border border-red-500/10 text-red-400/60 placeholder:text-red-400/40 cursor-not-allowed select-none"
											: "bg-white/[0.03] border border-white/[0.05] text-gray-200 placeholder:text-gray-500 focus:border-blue-500/30 focus:bg-white/[0.045]"
									}
									${isSubmitting ? "opacity-50" : ""}
								`}
							/>
							{isSuspended && (
								<div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400/40">
									<Lock size={14} />
								</div>
							)}
						</div>
					</form>
				</div>
			)}

			<AnimatePresence>
				{showComments && !isSuspended && (
					<CommentModal
						postId={post.id}
						post={{ ...post, comments: localCommentsCount }}
						type="review"
						onClose={() => setShowComments(false)}
						onCommentAdded={(newComment) => {
							setLocalCommentsCount((prev) => prev + 1);
							if (newComment && !newComment.parent_comment_id) {
								setLocalCommentList((prev) =>
									[newComment, ...prev].slice(0, 2),
								);
							}
						}}
						onCommentDeleted={(deletedId, amount = 1) => {
							setLocalCommentsCount((prev) =>
								Math.max(prev - amount, 0),
							);
							setLocalCommentList((prev) =>
								prev.filter((c) => c.id !== deletedId),
							);
						}}
					/>
				)}
			</AnimatePresence>

			<ShareModal
				isOpen={isShareOpen && !isSuspended}
				onClose={() => setIsShareOpen(false)}
				postId={post.id}
				onShareSuccess={handleShareSuccess}
			/>

			<ReportModal
				isOpen={!!reportTarget}
				onClose={() => setReportTarget(null)}
				entityId={reportTarget?.id || 0}
				entityType={reportTarget?.type || "comment"}
			/>
		</motion.div>
	);
}
