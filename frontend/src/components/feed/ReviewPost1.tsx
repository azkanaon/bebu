"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePostStore } from "@/stores/usePostStore";
import { ReviewPostType } from "@/types/post";
import { ThumbsUp, MessageCircle, Share2, Bookmark, Send } from "lucide-react";
import PostMenu from "./PostMenu";
import { toggleLikeAPI, toggleSaveAPI, createCommentAPI } from "@/lib/api";
import { useState, useEffect } from "react";
import CommentModal from "./CommentModal";
import ShareModal from "./ShareModal";

type Props = {
	post: ReviewPostType;
	isModalView?: boolean;
};

export default function ReviewPost({ post, isModalView = false }: Props) {
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

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			whileHover={
				isModalView
					? {}
					: {
							y: -4,
							scale: 1.005,
						}
			}
			transition={{
				type: "spring",
				stiffness: 260,
				damping: 20,
			}}
			whileTap={{ scale: 0.995 }}
			className={`
				relative overflow-hidden
				backdrop-blur-xl
				p-4
				space-y-4
				${
					isModalView
						? "w-full bg-[#0B1120]/95" // Tanpa border/rounded saat di modal
						: "bg-[#0B1120]/95 border border-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.55)]"
				}
				before:absolute
				before:inset-0
				before:bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.1),transparent)]
				before:pointer-events-none
				before:rounded-[inherit]
			`}
		>
			{/* Header */}
			<div className="flex items-start justify-between">
				<div className="flex gap-3">
					<div className="relative">
						<img
							src={post.user.avatar}
							className="w-12 h-12 rounded-2xl object-cover"
						/>

						<div className="absolute inset-0 rounded-2xl ring-1 ring-white/10" />
					</div>

					<div>
						<div className="font-semibold tracking-tight text-white">
							{post.user.displayName}
						</div>
						<div className="text-[12px] text-gray-500">
							@{post.user.username} • {post.createdAt}
						</div>
					</div>
				</div>

				<PostMenu postId={post.id} />
			</div>

			{/* Content */}
			<p
				className="text-[15px]
							leading-8
							text-gray-200/95
							font-[450]
							tracking-[0.01em]
							max-w-[68ch]
				"
			>
				{post.content}
			</p>

			{/* Book Card */}
			<motion.div
				whileHover={{ scale: 1.01 }}
				className="
					relative flex gap-4
					bg-gradient-to-br from-slate-900 to-slate-950
					border border-white/10
					backdrop-blur-md
					p-3
					rounded-3xl
					overflow-hidden
				"
			>
				{/* Spotlight Effect */}
				<div
					className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"
					aria-hidden="true"
				/>

				{/* Cover */}
				<motion.img
					src={post.book.cover}
					alt={post.book.title}
					className="
						w-24 h-36 
						object-cover 
						rounded-2xl 
						shadow-[0_10px_30px_rgba(0,0,0,0.45)]
					"
					whileHover={{
						rotate: -1,
						scale: 1.03,
					}}
					transition={{ duration: 0.2 }}
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

					<div className="flex flex-wrap gap-2 pt-1">
						{post.book.genres?.map((g) => (
							<span
								key={g}
								className="
									text-[10px] font-medium tracking-wide
									bg-white/[0.04] 
									text-gray-300 
									border border-white/10 
									backdrop-blur-md 
									rounded-lg 
									px-3 py-1
									transition-all duration-200
									hover:bg-blue-500/10 
									hover:border-blue-400/20
									hover:text-blue-200
									cursor-default
								"
							>
								{g}
							</span>
						))}
					</div>
				</div>

				{/* Rating */}
				<div className="absolute top-4 right-4 flex items-center gap-3">
					{/* Angka Rating dalam Pill */}
					<div className="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-300/20 backdrop-blur-sm shadow-sm">
						<span className="text-amber-200 text-xs font-bold tracking-wide">
							{post.book.rating.toFixed(1)}
						</span>
					</div>
				</div>
			</motion.div>

			{/* Actions */}
			<div className="flex items-center justify-between pt-4">
				{/* Container Toolbar Utama */}
				<div
					className="
        flex items-center gap-2 
        bg-white/[0.03] 
        backdrop-blur-xl 
        border border-white/10 
        rounded-2xl 
        px-3 py-1.5
        shadow-lg
    "
				>
					{/* Like Button */}
					<motion.button
						whileHover={{ scale: 1.08 }}
						whileTap={{ scale: 0.85 }}
						onClick={handleLike}
						disabled={isLoading}
						className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-300 ${
							currentData.is_liked
								? "text-blue-400 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
								: "text-gray-500 hover:text-blue-300 hover:bg-white/5"
						}`}
					>
						<motion.div
							// Efek denyut hanya jalan saat is_liked bernilai true
							animate={{
								scale: currentData.is_liked ? [1, 1.4, 1] : 1,
							}}
							transition={{
								duration: 0.4,
								ease: "backOut", // Memberikan efek pegas yang lebih halus
							}}
						>
							<ThumbsUp
								size={16}
								fill={
									currentData.is_liked
										? "currentColor"
										: "none"
								}
								style={{
									filter: currentData.is_liked
										? "drop-shadow(0 0 3px rgba(96,165,250,0.5))"
										: "none",
								}}
							/>
						</motion.div>

						<span className="text-xs font-semibold">
							{currentData.likes}
						</span>
					</motion.button>

					<div className="w-[1px] h-4 bg-white/10" />

					{/* Comment Button */}
					<motion.button
						whileTap={{ scale: 0.85 }}
						whileHover={{ scale: 1.08 }}
						onClick={() => !isModalView && setShowComments(true)}
						className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-gray-500 hover:text-green-400 hover:bg-white/5 transition-colors"
					>
						<MessageCircle size={16} />
						<span className="text-xs font-semibold">
							{localCommentsCount}
						</span>
					</motion.button>

					<div className="w-[1px] h-4 bg-white/10" />

					{/* Share Button */}
					<motion.button
						whileTap={{ scale: 0.85 }}
						whileHover={{ scale: 1.08 }}
						onClick={() => setIsShareOpen(true)}
						className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-gray-500 hover:text-purple-400 hover:bg-white/5 transition-colors"
					>
						<Share2 size={16} />
						<span className="text-xs font-semibold">
							{currentData.shares}
						</span>
					</motion.button>
				</div>

				{/* Bookmark Button (Terpisah di sisi kanan) */}
				<motion.button
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.8 }}
					onClick={handleSave}
					disabled={isSaveLoading}
					className={`p-2.5 rounded-xl border transition-all duration-300 ${
						currentData.is_saved
							? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
							: "text-gray-500 bg-white/[0.03] border-white/10 hover:text-yellow-300 hover:bg-yellow-400/5"
					}`}
				>
					<Bookmark
						size={18}
						fill={currentData.is_saved ? "currentColor" : "none"}
					/>
				</motion.button>
			</div>

			{!isModalView && (
				<div className="mt-6 space-y-4">
					{/* Top Gradient Separator */}
					<div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

					{/* Comment Container */}
					<div
						className="
            rounded-2xl 
            bg-black/20 
            border border-white/5 
            backdrop-blur-lg 
            p-4 
            space-y-4
        "
					>
						{/* Comment List */}
						<div className="space-y-3.5">
							{post.comment_list?.map((c) => (
								<div
									key={c.id}
									className="flex gap-3 items-start text-xs group"
								>
									{/* Avatar dengan Ring tipis */}
									<img
										src={
											c.avatar ||
											`https://ui-avatars.com/api/?name=${c.username}`
										}
										className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10 mt-1"
									/>

									{/* Comment Bubble yang diperbarui */}
									<div
										className="
											flex-1 
											bg-white/[0.03] 
											hover:bg-white/[0.05] 
											border border-white/5 
											rounded-2xl 
											rounded-tl-none 
											px-3 py-2 
											transition-colors 
											duration-200
										"
									>
										<div className="flex justify-between items-center mb-0.5">
											<span className="font-bold text-blue-300/90 text-[11px] tracking-wide">
												{c.username}
											</span>
										</div>
										<p className="text-gray-300 leading-relaxed">
											{c.comment}
										</p>
									</div>
								</div>
							))}
						</div>

						{/* View All Button */}
						{post.comments > 2 && (
							<button
								onClick={() => setShowComments(true)}
								className="
                        w-full py-2 text-[11px] text-gray-500 
                        hover:text-blue-300 hover:bg-white/[0.02] 
                        rounded-xl transition-all font-medium border border-transparent 
                        hover:border-white/5
                    "
							>
								Lihat semua {post.comments} komentar
							</button>
						)}

						{/* QUICK INPUT */}
						<form
							onSubmit={handlePostComment}
							className="flex items-center gap-3 pt-2"
						>
							{/* Foto Profil User dengan Glow Ring */}
							<img
								src={post.user.avatar}
								className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-500/10 shadow-sm"
							/>

							<div className="relative flex-1 group">
								<input
									disabled={isSubmitting}
									value={commentText}
									onChange={(e) =>
										setCommentText(e.target.value)
									}
									placeholder={
										isSubmitting
											? "Mengirim..."
											: "Tulis komentar..."
									}
									className="
                w-full 
                bg-white/[0.04] 
                backdrop-blur-md 
                border border-white/10 
                rounded-2xl 
                px-4 py-2.5 
                text-xs text-white 
                placeholder:text-gray-500
                transition-all duration-300
                
                /* State: Focus (Saat User Klik) */
                focus:outline-none 
                focus:border-blue-400/40 
                focus:ring-4 
                focus:ring-blue-500/10
                focus:bg-white/[0.07]
                
                disabled:opacity-50
            "
								/>

								{/* Opsional: Tombol Kirim Kecil di Dalam Input */}
								{commentText && !isSubmitting && (
									<motion.button
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-400 hover:text-blue-300 transition-colors"
									>
										<Send size={14} />
									</motion.button>
								)}
							</div>
						</form>
					</div>
				</div>
			)}

			<AnimatePresence>
				{showComments && (
					<CommentModal
						postId={post.id}
						post={post}
						type="review"
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
