"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePostStore } from "@/stores/usePostStore";
import { AnalysisPostType, CommentType } from "@/types/post";
import PostMenu from "./PostMenu";
import {
	ThumbsUp,
	MessageCircle,
	Share2,
	Bookmark,
	MoreVertical,
	AlertTriangle,
	Trash2,
	Flag,
} from "lucide-react";
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
import ClientPortal from "../ClientPortal";
import Link from "next/link";

type Props = {
	post: AnalysisPostType;
	isModalView?: boolean;
	disableCommentLink?: boolean;
};

export default function AnalysisPost({
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

	const handleLike = async () => {
		if (isLoading) return;

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
		if (isSaveLoading) return;

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
		if (!commentText.trim() || isSubmitting) return;

		setIsSubmitting(true);
		try {
			const payload = {
				post_id: post.id,
				parent_comment_id: null,
				comment: commentText,
			};

			const response = await createCommentAPI(payload);
			const newComment = response.data;

			// ✅ UPDATE STATE LOKAL (BUKAN PROPS)
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

	const authStorage = localStorage.getItem("bebu-auth-storage");
	const parsedStorage = authStorage ? JSON.parse(authStorage) : null;
	const user = parsedStorage?.state?.user;
	const currentUserId = user?.user_public_id;

	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

	const [openMenuId, setOpenMenuId] = useState<number | null>(null);

	const handleDelete = async (commentId: number, postId: number) => {
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

			// kalau klik masih di area dropdown/menu
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

	const [isImageOpen, setIsImageOpen] = useState(false);

	// Mengunci page (tidak bisa di-scroll) ketika open Image
	useEffect(() => {
		if (isImageOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}

		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isImageOpen]);

	const commentButtonContent = (
		<motion.button
			whileTap={disableCommentLink ? {} : { scale: 0.97 }} // opsional: matikan efek membalas/tekan jika link mati, atau biarkan saja
			className={`
        flex items-center gap-1.5
        px-2 py-1.5
        rounded-full
        text-gray-500
        transition-all duration-200
        hover:bg-white/[0.03]
        hover:text-green-400
        ${disableCommentLink ? "cursor-default" : "cursor-pointer"} 
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
						? "p-5 border-none shadow-none rounded-none" // Gaya menyatu dengan modal
						: "p-4 border border-gray-800 rounded-2xl shadow-[0_6px_30px_rgba(0,0,0,0.4)]"
				}
			`}
		>
			{/* HEADER */}
			<div className="flex items-start justify-between">
				<div className="flex gap-3 items-center">
					{/* Cover + Avatar */}
					<div className="relative">
						<img
							src={post.book.cover}
							className="w-10 h-14 rounded-md object-cover shadow-md"
						/>

						<img
							src={
								post.user.avatar ||
								"https://ui-avatars.com/api/?name=" +
									post.user.username
							}
							className="
								w-7 h-7 rounded-full absolute 
								-bottom-1 -right-1 
								border-2 border-gray-900
								object-cover
								ring-1 ring-gray-700
							"
						/>
					</div>

					{/* Info */}
					<div>
						<div className="pt-[1px]">
							<Link
								href={`/books/${post.book.slug}`}
								className="
									font-semibold text-white leading-snug
									block width-fit
									hover:text-blue-400
									hover:underline
									decoration-blue-400/40
									underline-offset-2
									transition-all duration-200
								"
							>
								{post.book.title}
							</Link>

							<div className="flex items-center gap-1 text-xs">
								<Link
									href={`/${post.user.username}`}
									className="text-gray-400 hover:text-white hover:underline decoration-gray-500 underline-offset-2 transition-colors duration-150 ease-in-out cursor-pointer"
								>
									{post.user.displayName}
								</Link>

								<span className="text-gray-600">•</span>

								<span className="text-gray-500">
									{timeAgo(post.createdAt)}
								</span>
							</div>
						</div>
					</div>
				</div>

				<PostMenu
					postId={post.id}
					userPublicID={post.user.publicID}
					postPublicID={post.post_public_id}
				/>
			</div>

			{/* CONTENT */}
			<p className="text-[#d7dbe4] leading-relaxed max-w-[95%] font-[425] antialiased">
				{post.content}
			</p>

			{/* CATEGORIES (New Section) */}
			{post.categories && post.categories.length > 0 && (
				<div className="flex flex-wrap gap-2 mt-3 mb-4">
					{post.categories.map((cat) => (
						<span
							key={cat.id}
							className="
                    px-2.5 py-0.5 
                    text-[11px] font-medium tracking-wide
                    bg-blue-500/10 text-blue-300
                    border border-blue-500/20
                    rounded-full
                    backdrop-blur-sm
                    hover:bg-blue-500/20 transition-colors cursor-default
                "
						>
							{cat.name}
						</span>
					))}
				</div>
			)}

			{/* IMAGE (Enhanced) */}
			{post.image && (
				<motion.div
					whileHover={{ scale: 1.005 }}
					onClick={() => setIsImageOpen(true)}
					className="
            relative w-full h-[420px] overflow-hidden rounded-xl
            border border-gray-800 bg-gray-950
            cursor-zoom-in group
        "
				>
					{/* Layer 1: Blurred Background */}
					<img
						src={post.image}
						alt="blur background"
						className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40"
					/>

					{/* Layer 2: Main Image */}
					<img
						src={post.image}
						alt="analysis content"
						className="relative z-10 w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
					/>

					{/* Overlay Hint */}
					<div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center">
						<div className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white/80">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<circle cx="11" cy="11" r="8" />
								<line x1="21" y1="21" x2="16.65" y2="16.65" />
								<line x1="11" y1="8" x2="11" y2="14" />
								<line x1="8" y1="11" x2="14" y2="11" />
							</svg>
						</div>
					</div>
				</motion.div>
			)}

			{/* Actions */}
			<div className="flex items-center justify-between">
				<div className="flex gap-1 text-sm">
					{/* Like */}
					<motion.button
						whileTap={{ scale: 0.97 }}
						onClick={handleLike}
						disabled={isLoading}
						className={`
				flex items-center gap-1.5
				px-2 py-1.5
				rounded-full
				transition-all duration-200
				hover:bg-white/[0.03]
				${
					currentData.is_liked
						? "text-blue-400 bg-blue-500/10"
						: "text-gray-400 hover:text-blue-400"
				}
			`}
					>
						<ThumbsUp
							size={18}
							strokeWidth={2.3}
							fill={
								currentData.is_liked ? "currentColor" : "none"
							}
						/>

						<span className="font-medium tabular-nums">
							{currentData.likes}
						</span>
					</motion.button>

					{/* Comment */}
					{disableCommentLink ? (
						commentButtonContent
					) : (
						<Link
							href={`/post/${post.post_public_id}`}
							scroll={false}
						>
							{commentButtonContent}
						</Link>
					)}

					{/* Share */}
					<motion.button
						whileTap={{ scale: 0.97 }}
						onClick={() => setIsShareOpen(true)}
						className="
				flex items-center gap-1.5
				px-2 py-1.5
				rounded-full
				text-gray-500
				transition-all duration-200
				hover:bg-white/[0.03]
				hover:text-violet-400
			"
					>
						<Share2 size={18} strokeWidth={2.3} />

						<span className="font-medium tabular-nums">
							{currentData.shares}
						</span>
					</motion.button>
				</div>

				{/* Save */}
				<motion.button
					whileTap={{ scale: 0.95 }}
					onClick={handleSave}
					disabled={isSaveLoading}
					className={`
			p-2 rounded-full
			bg-white/[0.02]
			transition-all duration-200
			${
				currentData.is_saved
					? `
						text-yellow-400
						bg-yellow-500/10
						shadow-[0_0_16px_rgba(250,204,21,0.10)]
					`
					: `
						text-gray-500
						hover:text-yellow-400
						hover:bg-yellow-500/10
					`
			}
		`}
				>
					<Bookmark
						size={18}
						strokeWidth={2.3}
						fill={currentData.is_saved ? "currentColor" : "none"}
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
							{/* Avatar */}
							<img
								src={
									c.avatar ||
									"https://ui-avatars.com/api/?name=" +
										c.username
								}
								className="
							w-7 h-7
							rounded-full
							object-cover
							mt-0.5
							ring-1 ring-white/5
						"
							/>

							{/* Content */}
							<div className="flex-1 min-w-0">
								<div className="flex items-baseline gap-2 flex-wrap">
									<Link
										href={`/${c.username}`}
										className="
											font-medium
											text-gray-200
											text-sm
											hover:text-blue-400
											transition-colors
											cursor-pointer
										"
									>
										@{c.username}
									</Link>

									<span className="text-[11px] text-gray-600">
										{timeAgo(post.createdAt)}
									</span>
								</div>

								<p
									className="
								text-sm
								text-gray-400
								leading-relaxed
								antialiased
								break-words
							"
								>
									{c.comment}
								</p>
							</div>

							{/* Action Menu */}
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
										className="
				p-1.5
				rounded-full
				text-gray-600
				hover:text-gray-300
				hover:bg-white/[0.04]
				transition-all duration-200
			"
									>
										<MoreVertical
											size={15}
											strokeWidth={2.2}
										/>
									</button>

									{/* Dropdown */}
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
												transition={{
													duration: 0.16,
												}}
												className="
						absolute right-0 top-9
						w-46
						z-[999]
					"
											>
												<div
													className="
		overflow-hidden
		rounded-2xl
		border border-white/[0.06]
		bg-gray-900/95
		backdrop-blur-xl
		shadow-[0_12px_40px_rgba(0,0,0,0.45)]
	"
												>
													{String(
														c.user_public_id,
													) ===
													String(currentUserId) ? (
														confirmDeleteId ===
														c.id ? (
															<div className="w-44 p-3 space-y-2">
																{/* Header */}
																<div className="flex items-start gap-2">
																	<div
																		className="
							mt-[1px]
							text-red-400
						"
																	>
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
																		<p
																			className="
								text-xs
								font-medium
								text-gray-200
							"
																		>
																			Hapus
																			komentar?
																		</p>

																		<p
																			className="
								text-[11px]
								text-gray-500
								mt-0.5
								leading-relaxed
							"
																		>
																			Tindakan
																			ini
																			tidak
																			dapat
																			dibatalkan.
																		</p>
																	</div>
																</div>

																{/* Actions */}
																<div className="flex justify-end">
																	<button
																		onClick={() =>
																			setConfirmDeleteId(
																				null,
																			)
																		}
																		className="
							px-2.5 py-1
							text-[11px]
							text-gray-400
							hover:text-white
							transition-colors
						"
																	>
																		Batal
																	</button>

																	<button
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
																		className="
							px-2.5 py-1
							text-[11px]
							font-medium
							text-red-400
							hover:text-red-300
							transition-colors
						"
																	>
																		Hapus
																	</button>
																</div>
															</div>
														) : (
															<button
																onClick={(
																	e,
																) => {
																	e.stopPropagation();

																	setConfirmDeleteId(
																		c.id,
																	);
																}}
																className="
					w-full
					flex items-center gap-2
					px-4 py-2.5
					text-xs
					text-red-400
					hover:bg-red-500/10
					transition-colors
				"
															>
																<Trash2
																	size={13}
																	strokeWidth={
																		2.2
																	}
																/>
																Hapus
															</button>
														)
													) : (
														<button
															onClick={() => {
																setReportTarget(
																	{
																		id: c.user_id,
																		type: "comment",
																	},
																);

																setOpenMenuId(
																	null,
																);
															}}
															className="
				w-full
				flex items-center gap-2
				px-4 py-2.5
				text-xs
				text-gray-300
				hover:bg-white/[0.04]
				transition-colors
			"
														>
															<Flag
																size={13}
																strokeWidth={
																	2.2
																}
															/>
															Laporkan
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
					{!disableCommentLink && localCommentsCount > 2 && (
						<Link
							href={`/post/${post.post_public_id}`}
							scroll={false}
						>
							<button
								className="
                text-xs
                font-medium
                text-gray-400
                hover:text-gray-300
                transition-colors
                pl-12
                text-left
            "
							>
								Lihat semua {localCommentsCount} komentar
							</button>
						</Link>
					)}

					{/* Quick Comment Input */}
					<form
						onSubmit={handlePostComment}
						className="flex items-center gap-3 pt-1"
					>
						{/* Current User Avatar */}
						<img
							src={
								post.user.avatar ||
								"https://ui-avatars.com/api/?name=" +
									post.user.username
							}
							className="
					w-7 h-7
					rounded-full
					object-cover
					ring-1 ring-white/5
				"
						/>

						{/* Input Wrapper */}
						<div className="flex-1 relative">
							<input
								disabled={isSubmitting}
								value={commentText}
								onChange={(e) => setCommentText(e.target.value)}
								placeholder={
									isSubmitting
										? "Mengirim..."
										: "Bagikan pendapatmu..."
								}
								className={`
						w-full
						bg-white/[0.03]
						border border-white/[0.05]
						backdrop-blur-sm
						rounded-full
						px-4 py-2
						text-sm
						text-gray-200
						placeholder:text-gray-500
						transition-all duration-200
						focus:outline-none
						focus:border-blue-500/30
						focus:bg-white/[0.045]
						${isSubmitting ? "opacity-50" : ""}
					`}
							/>
						</div>
					</form>
				</div>
			)}

			<AnimatePresence>
				{showComments && (
					<CommentModal
						postId={post.id}
						post={{ ...post, comments: localCommentsCount }}
						type="analysis"
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
							// Kurangi count sesuai jumlah total (parent + children)
							setLocalCommentsCount((prev) =>
								Math.max(prev - amount, 0),
							);

							// Filter list luar (tetap filter berdasarkan ID yang dihapus saja
							// karena children-nya otomatis hilang saat parent-nya difilter)
							setLocalCommentList((prev) =>
								prev.filter((c) => c.id !== deletedId),
							);
						}}
					/>
				)}
			</AnimatePresence>

			<ShareModal
				isOpen={isShareOpen}
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

			<AnimatePresence>
				{isImageOpen && (
					<ClientPortal>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							onClick={() => setIsImageOpen(false)}
							className="fixed inset-0 z-[9999] bg-black cursor-zoom-out"
						>
							{/* LAYER 1: Background Blur */}
							<img
								src={post.image}
								alt="blur background"
								className="absolute inset-0 w-full h-full object-cover scale-105 blur-3xl opacity-50"
							/>

							{/* LAYER 2: Gambar Utama - Full Screen Stretch */}
							<div className="relative z-10 w-screen h-screen flex items-center justify-center">
								<motion.img
									initial={{ scale: 0.95, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.95, opacity: 0 }}
									src={post.image}
									alt="full screen analysis"
									onClick={(e) => e.stopPropagation()}
									className="
                            w-full h-full 
                            object-contain 
                            pointer-events-none
                        "
								/>
							</div>

							{/* Tombol Close */}
							<button
								onClick={() => setIsImageOpen(false)}
								className="absolute top-5 right-5 z-20 p-2 rounded-full bg-black/50 text-white/80 backdrop-blur-md hover:bg-black/80 hover:text-white transition-all"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							</button>
						</motion.div>
					</ClientPortal>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
