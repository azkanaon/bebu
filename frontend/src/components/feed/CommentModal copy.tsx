"use client";

import { motion } from "framer-motion";
import { X, Send, Heart, MoreVertical, Trash2, Flag } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
	getCommentsAPI,
	createCommentAPI,
	toggleLikeCommentAPI,
	deleteCommentAPI,
} from "@/lib/api";
import {
	CommentType,
	CreateCommentRequest,
	AnalysisPostType,
	ReviewPostType,
} from "@/types/post";
import ReportModal from "./ReportModal";
import AnalysisPost from "./AnalysisPost";
import ReviewPost from "./ReviewPost";
import { timeAgo } from "@/lib/utils";

type Props = {
	postId: number;
	onClose: () => void;
	onCommentAdded?: () => void;
	post: AnalysisPostType | ReviewPostType;
	type: "analysis" | "review";
};

export default function CommentModal({
	postId,
	onClose,
	onCommentAdded,
	post,
	type,
}: Props) {
	const authStorage = localStorage.getItem("bebu-auth-storage");
	const parsedStorage = authStorage ? JSON.parse(authStorage) : null;

	const user = parsedStorage?.state?.user?.data;
	const currentUserId = user?.user_public_id;

	const [comments, setComments] = useState<CommentType[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchComments = useCallback(async () => {
		// Set loading true hanya jika ini bukan render pertama yang sudah default true
		setLoading(true);
		try {
			const data = await getCommentsAPI(postId);
			setComments(data);
		} catch (err) {
			console.error("Failed to fetch comments:", err);
		} finally {
			setLoading(false);
		}
	}, [postId]);

	const [commentText, setCommentText] = useState("");
	const [replyTo, setReplyTo] = useState<CommentType | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const handleSendComment = async () => {
		if (!commentText.trim() || submitting) return;

		setSubmitting(true);
		try {
			const payload: CreateCommentRequest = {
				post_id: postId,
				parent_comment_id: replyTo ? replyTo.id : null,
				comment: commentText,
			};

			const response = await createCommentAPI(payload);
			if (onCommentAdded) onCommentAdded();
			const newComment = response.data; // Data dari mapper ToCommentResponse

			if (replyTo) {
				// JIKA BALASAN: Masukkan ke dalam array replies parent-nya
				setComments((prevComments) =>
					prevComments.map((c) =>
						c.id === replyTo.id
							? {
									...c,
									replies: [...(c.replies || []), newComment],
								}
							: c,
					),
				);
			} else {
				// JIKA KOMENTAR UTAMA: Masukkan ke paling atas list
				setComments((prevComments) => [newComment, ...prevComments]);
			}

			// Reset Form
			setCommentText("");
			setReplyTo(null);
		} catch (err) {
			console.error("Gagal mengirim komentar:", err);
		} finally {
			setSubmitting(false);
		}
	};

	useEffect(() => {
		// Mengunci scroll
		document.body.style.overflow = "hidden";

		// Panggil fungsi fetch data
		// Kita bungkus dalam fungsi anonim atau biarkan async berjalan di background
		const initModal = async () => {
			await fetchComments();
		};

		initModal();

		// Cleanup function
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [fetchComments]);

	const inputRef = useRef<HTMLTextAreaElement>(null);

	const handleReplyClick = (comment: CommentType) => {
		setReplyTo(comment);

		// Gunakan timeout sedikit agar UI sempat merender indikator "Membalas @..."
		setTimeout(() => {
			inputRef.current?.focus();
		}, 100);
	};

	const handleToggleLike = async (commentId: number) => {
		try {
			setComments((prevComments: CommentType[]) => {
				const updateRecursive = (
					list: CommentType[],
				): CommentType[] => {
					return list.map((c: CommentType) => {
						if (c.id === commentId) {
							const currentlyLiked = c.is_liked;
							return {
								...c,
								is_liked: !currentlyLiked,
								likeCount: currentlyLiked
									? c.likeCount - 1
									: c.likeCount + 1,
							};
						}
						if ((c.replies ?? []).length > 0) {
							return {
								...c,
								replies: updateRecursive(c.replies ?? []),
							};
						}
						return c;
					});
				};
				return updateRecursive(prevComments);
			});

			await toggleLikeCommentAPI(commentId);
		} catch (err) {
			console.error("Gagal like:", err);
		}
	};

	const [openMenuId, setOpenMenuId] = useState<number | null>(null);

	const handleDelete = async (commentId: number, postId: number) => {
		if (!confirm("Yakin ingin menghapus komentar ini?")) return;

		try {
			// Optimistic Update: Hapus dari state lokal
			setComments((prev) => {
				const removeRecursive = (
					list: CommentType[],
				): CommentType[] => {
					return list
						.filter((c) => c.id !== commentId) // Hapus jika ID cocok
						.map((c) => ({
							...c,
							replies: removeRecursive(c.replies || []), // Cek di balasan
						}));
				};
				return removeRecursive(prev);
			});

			await deleteCommentAPI(commentId, postId);
			setOpenMenuId(null);
		} catch (err) {
			console.error("Gagal menghapus:", err);
			alert("Gagal menghapus komentar.");
			// Opsi: Fetch ulang data jika gagal agar sinkron kembali
		}
	};

	const [reportTarget, setReportTarget] = useState<{
		id: number;
		type: "post" | "comment";
	} | null>(null);

	const modalContent = (
		<div className="fixed inset-0 z-[999] flex items-center justify-center p-0 sm:p-4">
			{/* Backdrop dengan Blur */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onClick={onClose}
				className="absolute inset-0 bg-black/70 backdrop-blur-md"
			/>

			{/* Main Modal Container */}
			<motion.div
				initial={{ y: "100%", opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				exit={{ y: "100%", opacity: 0 }}
				transition={{ type: "spring", damping: 25, stiffness: 200 }}
				className="
          relative bg-gray-950 w-full max-w-2xl
          h-full sm:h-[90vh] 
          rounded-t-[2rem] sm:rounded-2xl 
          border-t sm:border border-gray-800 
          flex flex-col shadow-2xl overflow-hidden
        "
			>
				{/* Header */}
				<div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-950/50 backdrop-blur-md sticky top-0 z-10">
					<div>
						<h3 className="text-white font-bold text-lg leading-tight">
							Diskusi
						</h3>
						<p className="text-xs text-gray-500">
							Berbagi pandangan tentang buku ini
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 p-2 hover:bg-gray-800 rounded-full transition"
					>
						<X size={22} />
					</button>
				</div>

				{/* Scrollable Comment List */}
				<div className="flex-1 overflow-y-auto custom-scrollbar">
					<div className="border-b border-gray-800 bg-gray-900/20">
						{type === "analysis" ? (
							// Pastikan AnalysisPost sudah di-import di atas
							<AnalysisPost
								post={post as AnalysisPostType}
								isModalView={true}
							/>
						) : (
							<ReviewPost
								post={post as ReviewPostType}
								isModalView={true}
							/>
						)}
					</div>
					<div className="p-5 space-y-6">
						{loading ? (
							<div className="flex flex-col items-center justify-center h-full space-y-3">
								<div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
								<p className="text-gray-500 text-sm animate-pulse">
									Memuat komentar...
								</p>
							</div>
						) : (comments?.length ?? 0) === 0 ? (
							<div className="text-center py-20">
								<div className="text-gray-700 mb-2 flex justify-center">
									<Send size={40} className="opacity-20" />
								</div>
								<p className="text-gray-500 font-medium">
									Belum ada diskusi
								</p>
								<p className="text-xs text-gray-600">
									Mulai percakapan pertama Anda!
								</p>
							</div>
						) : (
							comments.map((c) => (
								<div
									key={c.id}
									className="flex flex-col gap-3 group"
								>
									{/* KOMENTAR UTAMA */}
									<div className="flex gap-3 items-start group/main relative">
										<img
											src={
												c.avatar ||
												"https://ui-avatars.com/api/?name=" +
													c.username
											}
											alt={c.username}
											className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-800"
										/>
										<div className="flex-1">
											<div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-3 group-hover:bg-gray-900 transition-colors relative">
												<div className="flex justify-between items-center mb-1 pr-6">
													{" "}
													<div className="flex items-center gap-2">
														<p className="text-sm font-bold text-blue-400">
															@{c.username}
														</p>

														<span className="text-[11px] text-gray-600">
															{timeAgo(
																c.created_at,
															)}
														</span>
													</div>
													{/* --- MENU ACTIONS (TITIK TIGA) --- */}
													<div className="absolute right-3 top-3">
														<div className="relative group/menu">
															<button className="p-1 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-gray-800">
																{/* Menggunakan MoreVertical agar titik tiganya berdiri */}
																<MoreVertical
																	size={16}
																/>
															</button>

															<div className="invisible group-hover/menu:visible opacity-0 group-hover/menu:opacity-100 absolute right-0 mt-1 w-32 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 transition-all duration-200 overflow-hidden">
																{String(
																	c.user_public_id,
																) ===
																String(
																	currentUserId,
																) ? (
																	<button
																		onClick={() =>
																			handleDelete(
																				c.id,
																				postId,
																			)
																		}
																		className="w-full px-4 py-2 text-left text-[11px] text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
																	>
																		<Trash2
																			size={
																				12
																			}
																		/>{" "}
																		Hapus
																	</button>
																) : (
																	<button
																		onClick={() =>
																			setReportTarget(
																				{
																					id: c.id,
																					type: "comment",
																				},
																			)
																		}
																		className="w-full px-4 py-2 text-left text-[11px] text-gray-400 hover:bg-gray-800 flex items-center gap-2 transition-colors"
																	>
																		<Flag
																			size={
																				12
																			}
																		/>
																		Laporkan
																	</button>
																)}
															</div>
														</div>
													</div>
												</div>
												<p className="text-sm text-gray-200 leading-relaxed">
													{c.comment}
												</p>
											</div>

											{/* Tombol Aksi */}
											<div className="flex gap-4 mt-2 ml-2">
												<button
													onClick={() =>
														handleToggleLike(c.id)
													}
													className={`flex items-center gap-1 text-[10px] transition-all duration-200 font-bold uppercase tracking-wider ${
														c.is_liked
															? "text-red-500 scale-110"
															: "text-gray-500 hover:text-red-400"
													}`}
												>
													{/* Gunakan Heart fill jika is_liked true */}
													<Heart
														size={12}
														fill={
															c.is_liked
																? "currentColor"
																: "none"
														}
														className={
															c.is_liked
																? "animate-pulse"
																: ""
														}
													/>

													{/* Tampilkan angka jika > 0, jika 0 tampilkan teks "Suka" saja */}
													{c.likeCount > 0 ? (
														<span>
															{c.likeCount}
														</span>
													) : (
														<span>
															{c.likeCount}
														</span>
													)}
												</button>
												<button
													onClick={() =>
														handleReplyClick(c)
													}
													className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-blue-400 transition font-bold uppercase tracking-wider"
												>
													Balas
												</button>
											</div>

											{/* --- RENDER BALASAN (REPLIES) --- */}
											{c.replies &&
												Array.isArray(c.replies) &&
												c.replies.length > 0 && (
													<div className="mt-4 ml-6 border-l border-gray-800 pl-6 space-y-6">
														{c.replies?.map(
															(reply) => (
																<div
																	key={
																		reply.id
																	}
																	className="flex gap-3 items-start relative group/reply"
																>
																	<img
																		src={
																			reply.avatar ||
																			"https://ui-avatars.com/api/?name=" +
																				reply.username
																		}
																		alt={
																			reply.username
																		}
																		className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-800"
																	/>
																	<div className="flex-1">
																		<div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-3 relative">
																			<div className="flex justify-between items-center mb-1 pr-6">
																				<div className="flex items-center gap-2">
																					<p className="text-sm font-bold text-blue-400">
																						@
																						{
																							reply.username
																						}
																					</p>

																					{/* Waktu sekarang menempel di kanan username */}
																					<span className="text-[11px] text-gray-500">
																						{timeAgo(
																							reply.created_at,
																						)}
																					</span>
																				</div>

																				{/* Action Menu untuk Reply */}
																				<div className="absolute right-3 top-3 group/replymenu">
																					<button className="p-1 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-gray-800">
																						<MoreVertical
																							size={
																								16
																							}
																						/>
																					</button>
																					<div className="invisible group-hover/replymenu:visible opacity-0 group-hover/replymenu:opacity-100 absolute right-0 mt-1 w-32 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 transition-all duration-200 overflow-hidden">
																						{currentUserId &&
																						reply.user_public_id &&
																						String(
																							reply.user_public_id,
																						) ===
																							String(
																								currentUserId,
																							) ? (
																							<button
																								onClick={() =>
																									handleDelete(
																										reply.id, // ID komentar/balasan yang akan dihapus
																										postId, // ID postingan asal
																									)
																								}
																								className="w-full px-4 py-2 text-left text-[11px] text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
																							>
																								<Trash2
																									size={
																										12
																									}
																								/>
																								Hapus
																							</button>
																						) : (
																							<button
																								onClick={() =>
																									setReportTarget(
																										{
																											id: c.id,
																											type: "comment",
																										},
																									)
																								}
																								className="w-full px-4 py-2 text-left text-[11px] text-gray-400 hover:bg-gray-800 flex items-center gap-2 transition-colors"
																							>
																								<Flag
																									size={
																										12
																									}
																								/>
																								Laporkan
																							</button>
																						)}
																					</div>
																				</div>
																			</div>
																			<p className="text-sm text-gray-200 leading-relaxed">
																				{
																					reply.comment
																				}
																			</p>
																		</div>
																		<div className="flex gap-4 mt-2 ml-2">
																			<button
																				onClick={() =>
																					handleToggleLike(
																						reply.id,
																					)
																				}
																				className={`flex items-center gap-1 text-[10px] transition-all duration-200 font-bold uppercase tracking-wider ${
																					reply.is_liked
																						? "text-red-500 scale-110"
																						: "text-gray-500 hover:text-red-400"
																				}`}
																			>
																				<Heart
																					size={
																						12
																					}
																					fill={
																						reply.is_liked
																							? "currentColor"
																							: "none"
																					}
																				/>
																				{reply.likeCount >
																				0 ? (
																					<span>
																						{
																							reply.likeCount
																						}
																					</span>
																				) : (
																					"Suka"
																				)}
																			</button>
																			<button
																				onClick={() =>
																					handleReplyClick(
																						reply,
																					)
																				}
																				className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-blue-400 transition font-bold uppercase tracking-wider"
																			>
																				Balas
																			</button>
																		</div>
																	</div>
																</div>
															),
														)}
													</div>
												)}
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* Bottom Input Area */}
				<div className="p-4 border-t border-gray-800 bg-gray-900/80 backdrop-blur-md">
					{/* Indikator Balasan: Muncul hanya jika replyTo tidak null */}
					{replyTo && (
						<div className="flex justify-between items-center bg-blue-500/10 border-l-2 border-blue-500 px-3 py-1.5 mb-2 rounded-r-lg animate-in fade-in slide-in-from-left-2">
							<p className="text-[10px] text-blue-400">
								Membalas{" "}
								<span className="font-bold">
									@{replyTo.username}
								</span>
							</p>
							<button
								onClick={() => setReplyTo(null)}
								className="text-gray-500 hover:text-white transition"
							>
								<X size={14} />
							</button>
						</div>
					)}

					<div className="flex gap-3 items-end">
						<textarea
							ref={inputRef} // Pasang ref di sini
							value={commentText}
							onChange={(e) => setCommentText(e.target.value)}
							placeholder={
								replyTo
									? `Balas @${replyTo.username}...`
									: "Tulis pendapat Anda..."
							}
							className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none transition-all"
							rows={1}
						/>
						<button
							onClick={handleSendComment}
							disabled={!commentText.trim() || submitting}
							className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:opacity-50 rounded-full transition-all"
						>
							<Send size={18} className="text-white" />
						</button>
					</div>
				</div>
			</motion.div>

			<ReportModal
				isOpen={!!reportTarget}
				onClose={() => setReportTarget(null)}
				entityId={reportTarget?.id || 0}
				entityType={reportTarget?.type || "comment"}
			/>
		</div>
	);

	// 3. Portal ke Body
	if (typeof document === "undefined") return null;
	return createPortal(modalContent, document.body);
}
