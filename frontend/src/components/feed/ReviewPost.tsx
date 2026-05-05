"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReviewPostType } from "@/types/post";
import { ThumbsUp, MessageCircle, Share2, Bookmark, Star } from "lucide-react";
import PostMenu from "./PostMenu";
import { toggleLikeAPI, toggleSaveAPI, createCommentAPI } from "@/lib/api";
import { useState } from "react";
import CommentModal from "./CommentModal";

type Props = {
	post: ReviewPostType;
};

export default function ReviewPost({ post }: Props) {
	const [isLoading, setIsLoading] = useState(false);
	
	const [likesCount, setLikesCount] = useState(post.likes);
	const [isLiked, setIsLiked] = useState(post.is_liked);
	
	const handleLike = async () => {
		if (isLoading) return;
		
		const previousLikes = likesCount;
		const previousStatus = isLiked;
		
		setIsLiked(!previousStatus);
		setLikesCount(previousStatus ? previousLikes - 1 : previousLikes + 1);
		
		setIsLoading(true);
		try {
			// 3. Tembak API (Gunakan Number(post.id) jika id di TS adalah string)
			await toggleLikeAPI(Number(post.id));
		} catch (error) {
			// 4. Jika gagal, kembalikan ke kondisi semula
			setLikesCount(previousLikes);
			setIsLiked(previousStatus);
			console.error("Like failed:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const [isSaved, setIsSaved] = useState(post.is_saved);
	const [isSaveLoading, setIsSaveLoading] = useState(false);
	
	const handleSave = async () => {
		if (isSaveLoading) return;
		
		const previousStatus = isSaved;
	
			// 1. Optimistic Update (Ubah UI dulu)
			setIsSaved(!previousStatus);
	
			setIsSaveLoading(true);
			try {
				// 2. Tembak API
				// Asumsi toggleSaveAPI sudah dibuat di api.ts
				await toggleSaveAPI(Number(post.id));
			} catch (error) {
				// 3. Rollback jika gagal
				setIsSaved(previousStatus);
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

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			whileHover={{ y: -2 }}
			transition={{ duration: 0.2 }}
			className="
				bg-gradient-to-b from-gray-900 to-gray-950
				border border-gray-800
				rounded-2xl
				p-4
				space-y-4
				shadow-[0_6px_30px_rgba(0,0,0,0.4)]
			"
		>
			{/* Header */}
			<div className="flex items-start justify-between">
				<div className="flex gap-3">
					<img
						src={post.user.avatar}
						className="w-11 h-11 rounded-full ring-2 ring-gray-700"
					/>

					<div>
						<div className="font-semibold text-white leading-tight">
							{post.user.displayName}
						</div>
						<div className="text-xs text-gray-400">
							@{post.user.username} • {post.createdAt}
						</div>
					</div>
				</div>

				<PostMenu />
			</div>

			{/* Content */}
			<p className="text-gray-200 leading-relaxed">{post.content}</p>

			{/* Book Card */}
			<motion.div
				whileHover={{ scale: 1.01 }}
				className="
					relative flex gap-4
					bg-gradient-to-br from-gray-800/80 to-gray-900/80
					border border-gray-700/50
					backdrop-blur-md
					p-3
					rounded-xl
					overflow-hidden
					bg-right-bar
				"
			>
				{/* Glow effect */}
				<div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />

				{/* Cover */}
				<img
					src={post.book.cover}
					className="w-20 h-28 object-cover rounded-md shadow-md"
				/>

				{/* Info */}
				<div className="flex-1 space-y-1 pr-16">
					<div className="font-semibold text-white">
						{post.book.title}
					</div>

					<div className="text-sm text-gray-400">
						{post.book.author}
					</div>

					<div className="text-xs text-gray-400">
						{post.book.pages} halaman
					</div>

					<div className="flex flex-wrap gap-1 pt-1">
						{post.book.genres?.map((g) => (
							<span
								key={g}
								className="
									text-[11px]
									bg-gray-700/70
									border border-gray-600/50
									px-2 py-[2px]
									rounded-full
									text-gray-300
								"
							>
								{g}
							</span>
						))}
					</div>
				</div>

				{/* Rating */}
				<div className="absolute top-3 right-3 flex gap-[2px]">
					{Array.from({ length: post.book.rating }).map((_, i) => (
						<Star
							key={i}
							className="w-4 h-4 fill-yellow-400 text-yellow-400 drop-shadow"
						/>
					))}
				</div>
			</motion.div>

			{/* Actions */}
			<div className="flex items-center justify-between pt-2 border-t border-gray-800">
				<div className="flex gap-6 text-sm text-gray-400">
					<motion.button
						whileTap={{ scale: 0.9 }}
						onClick={handleLike} // <-- Hubungkan di sini
						disabled={isLoading}
						className={`flex items-center gap-1 transition ${
							isLiked
								? "text-blue-500"
								: "hover:text-blue-400 text-gray-500"
						}`}
					>
						<ThumbsUp
							size={18}
							// Beri warna isi (fill) jika di-like agar lebih jelas
							fill={isLiked ? "currentColor" : "none"}
						/>
						<span className="font-medium">{likesCount}</span>
					</motion.button>

					<motion.button
						whileTap={{ scale: 0.9 }}
						onClick={() => setShowComments(true)}
						className="flex items-center gap-1 hover:text-green-400 transition"
					>
						<MessageCircle size={18} />
						<span>{localCommentsCount}</span>
					</motion.button>

					<motion.button
						whileTap={{ scale: 0.9 }}
						className="flex items-center gap-1 hover:text-purple-400 transition"
					>
						<Share2 size={18} />
						<span>{post.shares}</span>
					</motion.button>
				</div>

				<motion.button
					whileTap={{ scale: 0.8 }}
					onClick={handleSave}
					disabled={isSaveLoading}
					className={`transition-colors p-2 rounded-full ${
						isSaved
							? "text-yellow-500 bg-yellow-500/10"
							: "text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10"
					}`}
				>
					<Bookmark
						size={18}
						// Efek fill (isi warna) jika di-save
						fill={isSaved ? "currentColor" : "none"}
					/>
				</motion.button>
			</div>

			<div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
				{post.comment_list?.map((c) => (
					<div key={c.id} className="flex gap-2 items-start text-sm">
						<img
							src={
								c.avatar ||
								"https://ui-avatars.com/api/?name=" + c.username
							}
							className="w-6 h-6 rounded-full object-cover mt-0.5"
						/>
						<div className="flex-1">
							<span className="font-bold text-gray-200 mr-2">
								{c.username}
							</span>
							<span className="text-gray-400">{c.comment}</span>
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
							isSubmitting ? "Mengirim..." : "Tulis komentar..."
						}
						className={`flex-1 bg-gray-800/50 border border-gray-700 rounded-full px-4 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition ${isSubmitting ? "opacity-50" : ""}`}
					/>
				</form>
			</div>

			<AnimatePresence>
				{showComments && (
					<CommentModal
						postId={post.id}
						onClose={() => setShowComments(false)}
						onCommentAdded={() =>
							setLocalCommentsCount((prev) => prev + 1)
						}
					/>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
