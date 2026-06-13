"use client";

import { motion } from "framer-motion";
import { X, Send, AlertCircle } from "lucide-react"; // 🔥 Tambah AlertCircle untuk info suspend
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
import CommentItem from "./CommentItem";
import { usePathname, useRouter } from "next/navigation";

type Props = {
	postId: number;
	onClose: () => void;
	onCommentAdded?: (newComment: CommentType) => void;
	onCommentDeleted?: (commentId: number, amount?: number) => void;
	post: AnalysisPostType | ReviewPostType;
	type: "analysis" | "review";
	isStandalonePage?: boolean;
};

export default function CommentModal({
	postId,
	onClose,
	onCommentAdded,
	onCommentDeleted,
	post,
	type,
	isStandalonePage = false,
}: Props) {
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (isStandalonePage) return;

		const handleGlobalClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const anchor = target.closest("a");

			if (
				anchor &&
				anchor.href &&
				anchor.href.startsWith(window.location.origin)
			) {
				const targetPath = anchor.href.replace(
					window.location.origin,
					"",
				);

				if (targetPath === pathname) return;

				e.preventDefault();
				e.stopPropagation();

				router.back();

				setTimeout(() => {
					router.push(targetPath);
				}, 50);
			}
		};

		document.addEventListener("click", handleGlobalClick, true);

		return () => {
			document.removeEventListener("click", handleGlobalClick, true);
		};
	}, [isStandalonePage, router, pathname]);

	const [currentUserId, setCurrentUserId] = useState<
		string | number | undefined
	>(undefined);

	// 🔥 State untuk melacak status suspensi user
	const [isSuspended, setIsSuspended] = useState(false);

	// Get Current User ID & Status
	useEffect(() => {
		try {
			const authStorage = localStorage.getItem("bebu-auth-storage");
			if (authStorage) {
				const parsedStorage = JSON.parse(authStorage);
				const user = parsedStorage?.state?.user;
				const userPublicId = user?.user_public_id;

				if (userPublicId) {
					setCurrentUserId(userPublicId);
				} else {
					console.warn(
						"user_public_id tidak ditemukan di dalam objek user:",
						user,
					);
				}

				// 🔥 Validasi status suspensi dari local storage
				if (user?.status === "suspended") {
					setIsSuspended(true);
				}
			}
		} catch (error) {
			console.error("Gagal membaca token auth dari localStorage:", error);
		}
	}, []);

	const [comments, setComments] = useState<CommentType[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchComments = useCallback(async () => {
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

	const [prevPost, setPrevPost] = useState(post);
	const [currentPost, setCurrentPost] = useState(post);

	if (post.comments !== prevPost.comments) {
		setPrevPost(post);
		setCurrentPost(post);
	}

	const handleSendComment = async () => {
		// 🔥 Blokir eksekusi fungsi jika user terdeteksi suspended
		if (!commentText.trim() || submitting || isSuspended) return;

		setSubmitting(true);
		try {
			const payload: CreateCommentRequest = {
				post_id: postId,
				parent_comment_id: replyTo ? replyTo.id : null,
				comment: commentText,
			};

			const response = await createCommentAPI(payload);
			const newComment = response.data;

			setCurrentPost((prev) => ({
				...prev,
				comments: (prev.comments || 0) + 1,
			}));

			if (onCommentAdded) {
				onCommentAdded(newComment);
			}

			if (replyTo) {
				setComments((prevComments) => {
					const currentComments = Array.isArray(prevComments)
						? prevComments
						: [];

					const insertReplyRecursive = (
						list: CommentType[],
					): CommentType[] => {
						return list.map((c) => {
							if (c.id === replyTo.id) {
								return {
									...c,
									replies: [newComment, ...(c.replies || [])],
								};
							}

							if (c.replies && c.replies.length > 0) {
								return {
									...c,
									replies: insertReplyRecursive(c.replies),
								};
							}

							return c;
						});
					};

					return insertReplyRecursive(currentComments);
				});
			} else {
				setComments((prevComments) => {
					const currentComments = Array.isArray(prevComments)
						? prevComments
						: [];
					return [newComment, ...currentComments];
				});
			}

			if (focusedComment) {
				setFocusedComment((prev) => {
					if (!prev) return null;

					if (prev.id === replyTo?.id) {
						return {
							...prev,
							replies: [newComment, ...(prev.replies || [])],
						};
					}

					const insertInFocusRecursive = (
						list: CommentType[],
					): CommentType[] => {
						return list.map((r) => {
							if (r.id === replyTo?.id) {
								return {
									...r,
									replies: [newComment, ...(r.replies || [])],
								};
							}
							if (r.replies && r.replies.length > 0) {
								return {
									...r,
									replies: insertInFocusRecursive(r.replies),
								};
							}
							return r;
						});
					};

					return {
						...prev,
						replies: insertInFocusRecursive(prev.replies || []),
					};
				});
			}

			setCommentText("");
			setReplyTo(null);
		} catch (err: unknown) {
			console.error("Gagal mengirim komentar:", err);
		} finally {
			setSubmitting(false);
		}
	};

	useEffect(() => {
		if (isStandalonePage) {
			fetchComments();
			return;
		}

		document.body.style.overflow = "hidden";

		const initModal = async () => {
			await fetchComments();
		};
		initModal();

		return () => {
			document.body.style.overflow = "unset";
		};
	}, [fetchComments, isStandalonePage]);

	const inputRef = useRef<HTMLTextAreaElement>(null);

	const handleReplyClick = (comment: CommentType) => {
		// 🔥 Cegah reply jikalau user disuspensi
		if (isSuspended) return;

		setReplyTo(comment);

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

			if (focusedComment) {
				setFocusedComment((prev) => {
					if (!prev) return null;

					if (prev.id === commentId) {
						const currentlyLiked = prev.is_liked;
						return {
							...prev,
							is_liked: !currentlyLiked,
							likeCount: currentlyLiked
								? prev.likeCount - 1
								: prev.likeCount + 1,
						};
					}

					const updateRepliesRecursive = (
						list: CommentType[],
					): CommentType[] => {
						return list.map((r) => {
							if (r.id === commentId) {
								const currentlyLiked = r.is_liked;
								return {
									...r,
									is_liked: !currentlyLiked,
									likeCount: currentlyLiked
										? r.likeCount - 1
										: r.likeCount + 1,
								};
							}
							if ((r.replies ?? []).length > 0) {
								return {
									...r,
									replies: updateRepliesRecursive(
										r.replies ?? [],
									),
								};
							}
							return r;
						});
					};

					return {
						...prev,
						replies: updateRepliesRecursive(prev.replies ?? []),
					};
				});
			}

			await toggleLikeCommentAPI(commentId);
		} catch (err) {
			console.error("Gagal like:", err);
		}
	};

	const [openMenuId, setOpenMenuId] = useState<number | null>(null);

	const handleDelete = async (commentId: number, postId: number) => {
		const countItemsRecursive = (
			list: CommentType[],
			targetId: number,
		): number => {
			for (const item of list) {
				if (item.id === targetId) {
					const countReplies = (replies: CommentType[]): number => {
						return replies.reduce(
							(acc, reply) =>
								acc + 1 + countReplies(reply.replies || []),
							0,
						);
					};
					return 1 + countReplies(item.replies || []);
				}
				if (item.replies) {
					const foundInReplies = countItemsRecursive(
						item.replies,
						targetId,
					);
					if (foundInReplies > 0) return foundInReplies;
				}
			}
			return 0;
		};

		const totalToReduce = countItemsRecursive(comments, commentId);

		const previousComments = comments;
		const previousFocused = focusedComment;
		const previousPostData = currentPost;

		try {
			setComments((prev) => {
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

			if (focusedComment) {
				if (focusedComment.id === commentId) {
					setFocusedComment(null);
				} else {
					setFocusedComment((prev) => {
						if (!prev) return null;
						const removeRepliesRecursive = (
							list: CommentType[],
						): CommentType[] => {
							return list
								.filter((r) => r.id !== commentId)
								.map((r) => ({
									...r,
									replies: removeRepliesRecursive(
										r.replies || [],
									),
								}));
						};
						return {
							...prev,
							replies: removeRepliesRecursive(prev.replies || []),
						};
					});
				}
			}

			await deleteCommentAPI(commentId, postId);

			setCurrentPost((prev) => ({
				...prev,
				comments: Math.max(0, (prev.comments || 0) - totalToReduce),
			}));

			if (onCommentDeleted) {
				onCommentDeleted(commentId, totalToReduce);
			}

			setOpenMenuId(null);
		} catch (err) {
			console.error("Gagal menghapus:", err);

			setComments(previousComments);
			setFocusedComment(previousFocused);
			setCurrentPost(previousPostData);

			alert("Gagal menghapus komentar.");
		}
	};

	const [reportTarget, setReportTarget] = useState<{
		id: number;
		type: "post" | "comment";
	} | null>(null);

	const [focusedComment, setFocusedComment] = useState<CommentType | null>(
		null,
	);
	const handleFocusThread = (comment: CommentType) => {
		setFocusedComment(comment);
	};
	const handleExitFocus = () => {
		setFocusedComment(null);
	};

	useEffect(() => {
		// Hanya jalankan logika ini jika modal dibuka sebagai pop-up (bukan standalone page)
		if (!isStandalonePage) {
			sessionStorage.setItem("is_comment_modal_open", "true");
			// Kirim sinyal (event) ke seluruh aplikasi bahwa status modal berubah
			window.dispatchEvent(new Event("modal-route-change"));
		}

		return () => {
			if (!isStandalonePage) {
				sessionStorage.removeItem("is_comment_modal_open");
				// Kirim sinyal kembali saat modal ditutup
				window.dispatchEvent(new Event("modal-route-change"));
			}
		};
	}, [isStandalonePage]);

	useEffect(() => {
		return () => {
			// Ketika modal di-unmount (ditutup), bersihkan flag agar tidak tertinggal jika user menekan tombol back/forward browser
			if (
				typeof window !== "undefined" &&
				window.history.state?.isModalView
			) {
				const newState = { ...window.history.state };
				delete newState.isModalView;
				window.history.replaceState(newState, "");
			}
		};
	}, []);

	const modalContent = (
		<div
			className={
				isStandalonePage
					? "w-full flex justify-center"
					: "fixed inset-0 z-[999] flex items-center justify-center p-0 sm:p-4"
			}
		>
			{!isStandalonePage && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={onClose}
					className="absolute inset-0 bg-black/70 backdrop-blur-md"
				/>
			)}

			<motion.div
				initial={isStandalonePage ? {} : { y: "100%", opacity: 0 }}
				animate={isStandalonePage ? {} : { y: 0, opacity: 1 }}
				exit={isStandalonePage ? {} : { y: "100%", opacity: 0 }}
				transition={{ type: "spring", damping: 25, stiffness: 200 }}
				className={
					isStandalonePage
						? "relative w-full flex flex-col flex-1 bg-gray-950/40 rounded-2xl border border-gray-800 overflow-hidden pb-[84px]"
						: "relative bg-gray-950 w-full max-w-2xl h-full sm:h-[90vh] rounded-t-[2rem] sm:rounded-2xl border-t sm:border border-gray-800 flex flex-col shadow-2xl overflow-hidden"
				}
			>
				{!isStandalonePage && (
					<div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-950/50 backdrop-blur-md sticky top-0 z-10">
						<div>
							<h3 className="text-white font-bold text-lg leading-tight">
								Discussion
							</h3>
							<p className="text-xs text-gray-500">
								Share your view about this book
							</p>
						</div>
						<button
							onClick={onClose}
							className="text-gray-400 p-2 hover:bg-gray-800 rounded-full transition"
						>
							<X size={22} />
						</button>
					</div>
				)}

				<div
					className={
						isStandalonePage
							? "flex-1 flex flex-col min-h-[calc(100vh-68px)] bg-gray-950"
							: "flex-1 overflow-y-auto custom-scrollbar"
					}
				>
					<div className="border-b border-gray-800 bg-gray-900/20">
						{type === "analysis" ? (
							<AnalysisPost
								key={`analysis-${currentPost.comments}`}
								post={currentPost as AnalysisPostType}
								isModalView={true}
								disableCommentLink={isStandalonePage}
							/>
						) : (
							<ReviewPost
								key={`review-${currentPost.comments}`}
								post={currentPost as ReviewPostType}
								isModalView={true}
								disableCommentLink={isStandalonePage}
							/>
						)}
					</div>

					{focusedComment && (
						<div className="p-4 bg-blue-500/5 border-b border-gray-800 flex items-center justify-between">
							<button
								onClick={handleExitFocus}
								className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-2 font-bold"
							>
								← Back to The Main Discussion
							</button>
							<span className="text-[10px] text-gray-500 italic">
								view sub-discussion
							</span>
						</div>
					)}

					<div
						className={`p-5 space-y-6 ${isStandalonePage ? "flex-1" : ""}`}
					>
						{loading ? (
							<div className="flex flex-col items-center justify-center h-full min-h-[200px] space-y-3">
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
						) : focusedComment ? (
							<CommentItem
								key={focusedComment.id}
								comment={focusedComment}
								postId={postId}
								currentUserId={currentUserId}
								depth={0}
								isReply={false}
								handleDelete={handleDelete}
								handleToggleLike={handleToggleLike}
								handleReplyClick={handleReplyClick}
								setReportTarget={setReportTarget}
								onFocusThread={handleFocusThread}
							/>
						) : (
							comments.map((c) => (
								<CommentItem
									key={c.id}
									comment={c}
									postId={postId}
									currentUserId={currentUserId}
									depth={0}
									handleDelete={handleDelete}
									handleToggleLike={handleToggleLike}
									handleReplyClick={handleReplyClick}
									setReportTarget={setReportTarget}
									onFocusThread={handleFocusThread}
								/>
							))
						)}
					</div>
				</div>

				{/* Bottom Input Area */}
				<div
					className={
						isStandalonePage
							? "fixed bottom-0 left-auto right-auto z-30 p-4 border-t border-x border-gray-800 bg-gray-950/95 backdrop-blur-md w-full max-w-[calc(100vw-24px)] sm:max-w-[600px] rounded-t-none"
							: "p-4 border-t border-gray-800 bg-gray-900/80 backdrop-blur-md"
					}
				>
					{/* 🔥 KONDISI 1: JIKA USER KENA SUSPEND */}
					{isSuspended ? (
						<div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-xs flex items-center gap-2 font-medium">
							<AlertCircle
								size={16}
								className="shrink-0 text-red-400"
							/>
							<span>
								Your account is suspended. You are restricted
								from participating in discussions.
							</span>
						</div>
					) : (
						/* KONDISI 2: JIKA USER NORMAL */
						<>
							{replyTo && (
								<div className="flex justify-between items-center bg-blue-500/10 border-l-2 border-blue-500 px-3 py-1.5 mb-2 rounded-r-lg">
									<p className="text-[10px] text-blue-400">
										Replying to{" "}
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
									ref={inputRef}
									value={commentText}
									onChange={(e) =>
										setCommentText(e.target.value)
									}
									placeholder={
										replyTo
											? `Replying to @${replyTo.username}...`
											: "Write your opinion..."
									}
									className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none transition-all"
									rows={1}
								/>
								<button
									onClick={handleSendComment}
									disabled={!commentText.trim() || submitting}
									className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:opacity-50 rounded-full transition-all cursor-pointer"
								>
									<Send size={18} className="text-white" />
								</button>
							</div>
						</>
					)}
				</div>
			</motion.div>

			{/* 🔥 Proteksi berlapis agar user suspended juga tidak bisa memicu modal report komentar */}
			<ReportModal
				isOpen={!!reportTarget && !isSuspended}
				onClose={() => setReportTarget(null)}
				entityId={reportTarget?.id || 0}
				entityType={reportTarget?.type || "comment"}
			/>
		</div>
	);

	if (isStandalonePage) {
		return modalContent;
	}

	if (typeof document === "undefined") return null;
	return createPortal(modalContent, document.body);
}
