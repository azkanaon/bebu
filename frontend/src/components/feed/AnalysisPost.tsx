"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePostStore } from "@/stores/usePostStore";
import { AnalysisPostType } from "@/types/post";
import PostMenu from "./PostMenu";
import { ThumbsUp, MessageCircle, Share2, Bookmark } from "lucide-react";
import { toggleLikeAPI, toggleSaveAPI, createCommentAPI } from "@/lib/api";
import { useState, useEffect } from "react";
import CommentModal from "./CommentModal";
import ShareModal from "./ShareModal";

type Props = {
	post: AnalysisPostType;
	isModalView?: boolean;
};

export default function AnalysisPost({ post, isModalView = false }: Props) {
	const [isLoading, setIsLoading] = useState(false);

	const { interactions, initPost, toggleLikeStore, toggleSaveStore, addShareCountStore } =
		usePostStore();

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

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			whileHover={isModalView ? {} : { y: -2 }}
			transition={{ duration: 0.2 }}
			className={`
				bg-gradient-to-b from-gray-900 to-gray-950
				border border-gray-800
				rounded-2xl
				p-4
				space-y-4
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
							src={post.user.avatar}
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
						<div className="font-semibold text-white leading-tight">
							{post.book.title}
						</div>

						<div className="text-xs text-gray-400">
							<span className="font-medium text-gray-300">
								{post.user.displayName}
							</span>{" "}
							• {post.createdAt}
						</div>
					</div>
				</div>

				<PostMenu postId={post.id} />
			</div>

			{/* CONTENT */}
			<p className="text-gray-200 leading-relaxed text-[15px]">
				{post.content}
			</p>

			{/* IMAGE (Enhanced) */}
			{post.image && (
				<motion.div
					whileHover={{ scale: 1.01 }}
					className="
						w-full overflow-hidden rounded-xl
						border border-gray-800
						bg-gray-900
					"
				>
					<img
						src={post.image}
						className="w-full h-full max-h-[420px] object-cover"
					/>
				</motion.div>
			)}

			{/* ACTIONS */}
			<div className="flex items-center justify-between pt-2 border-t border-gray-800">
				<div className="flex gap-6 text-sm text-gray-400">
					<motion.button
						whileTap={{ scale: 0.9 }}
						onClick={handleLike} // <-- Hubungkan di sini
						disabled={isLoading}
						className={`flex items-center gap-1 transition ${
							currentData.is_liked
								? "text-blue-500"
								: "hover:text-blue-400 text-gray-500"
						}`}
					>
						<ThumbsUp
							size={18}
							// Beri warna isi (fill) jika di-like agar lebih jelas
							fill={
								currentData.is_liked ? "currentColor" : "none"
							}
						/>
						<span className="font-medium">{currentData.likes}</span>
					</motion.button>

					<motion.button
						whileTap={{ scale: 0.9 }}
						onClick={() => !isModalView && setShowComments(true)}
						className="flex items-center gap-1 hover:text-green-400 transition"
					>
						<MessageCircle size={18} />
						<span>{localCommentsCount}</span>
					</motion.button>

					<motion.button
						whileTap={{ scale: 0.9 }}
						onClick={() => setIsShareOpen(true)}
						className="flex items-center gap-1 hover:text-purple-400 transition"
					>
						<Share2 size={18} />
						<span>{currentData.shares}</span>
					</motion.button>
				</div>

				<motion.button
					whileTap={{ scale: 0.8 }}
					onClick={handleSave}
					disabled={isSaveLoading}
					className={`transition-colors p-2 rounded-full ${
						currentData.is_saved
							? "text-yellow-500 bg-yellow-500/10"
							: "text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10"
					}`}
				>
					<Bookmark
						size={18}
						// Efek fill (isi warna) jika di-save
						fill={currentData.is_saved ? "currentColor" : "none"}
					/>
				</motion.button>
			</div>

			{!isModalView && (
				<div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
					{post.comment_list?.map((c) => (
						<div
							key={c.id}
							className="flex gap-2 items-start text-sm"
						>
							<img
								src={
									c.avatar ||
									"https://ui-avatars.com/api/?name=" +
										c.username
								}
								className="w-6 h-6 rounded-full object-cover mt-0.5"
							/>
							<div className="flex-1">
								<span className="font-bold text-gray-200 mr-2">
									{c.username}
								</span>
								<span className="text-gray-400">
									{c.comment}
								</span>
							</div>
						</div>
					))}

					{post.comments > 2 && (
						<button
							onClick={() => setShowComments(true)}
							className="text-xs text-gray-500 hover:text-gray-400 ml-8 font-medium"
						>
							Lihat semua {post.comments} komentar
						</button>
					)}

					{/* QUICK INPUT */}
					<form
						onSubmit={handlePostComment}
						className="flex items-center gap-2 mt-2"
					>
						<img
							src={post.user.avatar}
							className="w-6 h-6 rounded-full object-cover"
						/>
						<input
							disabled={isSubmitting}
							value={commentText}
							onChange={(e) => setCommentText(e.target.value)}
							placeholder={
								isSubmitting
									? "Mengirim..."
									: "Tulis komentar..."
							}
							className={`flex-1 bg-gray-800/50 border border-gray-700 rounded-full px-4 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition ${isSubmitting ? "opacity-50" : ""}`}
						/>
					</form>
				</div>
			)}

			<AnimatePresence>
				{showComments && (
					<CommentModal
						postId={post.id}
						post={post}
						type="analysis"
						onClose={() => setShowComments(false)}
						onCommentAdded={() =>
							setLocalCommentsCount((prev) => prev + 1)
						}
					/>
				)}
			</AnimatePresence>

			<ShareModal
				isOpen={isShareOpen}
				onClose={() => setIsShareOpen(false)}
				postId={post.id}
				onShareSuccess={handleShareSuccess}
			/>
		</motion.div>
	);
}
