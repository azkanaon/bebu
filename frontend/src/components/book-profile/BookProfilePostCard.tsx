"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, MessageCircle, Share2, Bookmark, Star } from "lucide-react";
import { BookReviewPostType, BookAnalysisPostType } from "@/types/book";
import { usePostStore } from "@/stores/usePostStore";
import { toggleLikeAPI, toggleSaveAPI } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import PostMenu from "../feed/PostMenu"; // Sesuaikan path PostMenu kamu
import CommentModal from "../feed/CommentModal"; // Sesuaikan path CommentModal kamu
import ShareModal from "../feed/ShareModal"; // Sesuaikan path ShareModal kamu
import ClientPortal from "../ClientPortal";

type BookProfilePostCardProps = {
	post: BookReviewPostType | BookAnalysisPostType;
};

export default function BookProfilePostCard({
	post,
}: BookProfilePostCardProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isSaveLoading, setIsSaveLoading] = useState(false);
	const [showCommentsModal, setShowCommentsModal] = useState(false);
	const [isShareOpen, setIsShareOpen] = useState(false);
	const [isImageOpen, setIsImageOpen] = useState(false);

	const {
		interactions,
		initPost,
		toggleLikeStore,
		toggleSaveStore,
		addShareCountStore,
	} = usePostStore();

	// Inisialisasi global state store untuk interaksi tombol (Like, Save, Share)
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

	const isAnalysis = post.type === "analysis";
	const analysisPost = post as BookAnalysisPostType;

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-slate-900/40 border border-white/[0.05] rounded-2xl p-4 space-y-3 shadow-md"
		>
			{/* HEADER */}
			<div className="flex items-start justify-between">
				<div className="flex gap-3 items-center">
					<img
						src={
							post.user.avatar ||
							`https://ui-avatars.com/api/?name=${post.user.displayName}`
						}
						className="w-9 h-9 rounded-full border border-white/10 object-cover"
						alt={post.user.displayName}
					/>
					<div>
						{!isAnalysis ? (
							<>
								{/* REVIEW HEADER */}
								<div className="flex items-center gap-1.5 text-[12px]">
									<span className="font-medium text-slate-200">
										{post.user.displayName}
									</span>

									<span className="text-slate-600">•</span>

									<span className="text-slate-500">
										{timeAgo(post.createdAt)}
									</span>
								</div>

								{/* REVIEW RATING */}
								{"rating" in post && (
									<div className="mt-1 flex items-center gap-1.5">
										<div className="flex items-center gap-0.5">
											{[1, 2, 3, 4, 5].map((star) => (
												<Star
													key={star}
													size={11}
													className={
														star <=
														Math.round(post.rating)
															? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.35)]"
															: "text-slate-700"
													}
												/>
											))}
										</div>

										<span className="text-[11px] font-medium text-amber-300/90">
											{post.rating.toFixed(1)}
										</span>
									</div>
								)}
							</>
						) : (
							<>
								{/* ANALYSIS HEADER */}
								<div className="font-semibold text-sm text-white leading-tight">
									{post.user.displayName}
								</div>

								<div className="mt-0.5 text-[11px] text-gray-500">
									{timeAgo(post.createdAt)}
								</div>
							</>
						)}
					</div>
				</div>

				<PostMenu
					postId={post.id}
					userPublicID={post.user.publicID}
					postPublicID={post.post_public_id}
				/>
			</div>

			{/* CONTENT */}
			<p className="text-gray-300 text-sm leading-relaxed antialiased whitespace-pre-line">
				{post.content}
			</p>

			{/* CATEGORIES (Jika Tipenya Analysis) */}
			{isAnalysis &&
				analysisPost.categories &&
				analysisPost.categories.length > 0 && (
					<div className="flex flex-wrap gap-1.5 pt-1">
						{analysisPost.categories.map((cat) => (
							<span
								key={cat.id}
								className="px-2 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full"
							>
								{cat.name}
							</span>
						))}
					</div>
				)}

			{/* IMAGE PREVIEW (Jika Tipenya Analysis & Ada Gambarnya) */}
			{isAnalysis && analysisPost.image && (
				<div
					onClick={() => setIsImageOpen(true)}
					className="relative w-full h-[240px] overflow-hidden rounded-xl border border-white/5 bg-black cursor-zoom-in group"
				>
					<img
						src={analysisPost.image}
						className="absolute inset-0 w-full h-full object-cover scale-105 blur-xl opacity-30"
						alt="blur-bg"
					/>
					<img
						src={analysisPost.image}
						className="relative z-10 w-full h-full object-contain transition-transform duration-200 group-hover:scale-[1.01]"
						alt="analysis-visual"
					/>
				</div>
			)}

			{/* DIVIDER */}
			<div className="border-t border-white/[0.04] my-1" />

			{/* ACTIONS FOOTER */}
			<div className="flex items-center justify-between pt-0.5">
				<div className="flex gap-2 text-xs">
					{/* LIKE BUTTON */}
					<button
						onClick={handleLike}
						disabled={isLoading}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
							currentData.is_liked
								? "text-blue-400 bg-blue-500/10"
								: "text-gray-400 hover:bg-white/[0.03] hover:text-blue-400"
						}`}
					>
						<ThumbsUp
							size={15}
							fill={
								currentData.is_liked ? "currentColor" : "none"
							}
						/>
						<span className="font-medium tabular-nums">
							{currentData.likes}
						</span>
					</button>

					{/* COMMENT BUTTON (Trigger Popup Modal Langsung) */}
					<button
						onClick={() => setShowCommentsModal(true)}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-gray-400 transition-colors hover:bg-white/[0.03] hover:text-green-400"
					>
						<MessageCircle size={15} />
						<span className="font-medium tabular-nums">
							{post.comments}
						</span>
					</button>

					{/* SHARE BUTTON */}
					<button
						onClick={() => setIsShareOpen(true)}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-gray-400 transition-colors hover:bg-white/[0.03] hover:text-violet-400"
					>
						<Share2 size={15} />
						<span className="font-medium tabular-nums">
							{currentData.shares}
						</span>
					</button>
				</div>

				{/* SAVE BUTTON (Tanpa counter angka) */}
				<button
					onClick={handleSave}
					disabled={isSaveLoading}
					className={`p-2 rounded-full transition-colors ${
						currentData.is_saved
							? "text-yellow-400 bg-yellow-500/10"
							: "text-gray-400 hover:bg-white/[0.03] hover:text-yellow-400"
					}`}
				>
					<Bookmark
						size={15}
						fill={currentData.is_saved ? "currentColor" : "none"}
					/>
				</button>
			</div>

			{/* --- SYSTEM MODALS EXTENSIONS --- */}
			<AnimatePresence>
				{showCommentsModal && (
					<CommentModal
						postId={post.id}
						// Tambahkan properti saved dan casting ke any untuk memuaskan TypeScript modal lama
						post={
							{
								...post,
								saved: 0,
								comment_list: [],
							} as any
						}
						type={post.type}
						onClose={() => setShowCommentsModal(false)}
						onCommentAdded={() => {}}
						onCommentDeleted={() => {}}
					/>
				)}
			</AnimatePresence>

			<ShareModal
				isOpen={isShareOpen}
				onClose={() => setIsShareOpen(false)}
				postId={post.id}
				onShareSuccess={(count) => addShareCountStore(post.id, count)}
			/>

			{/* FULLSCREEN IMAGE MODAL PORTAL */}
			<AnimatePresence>
				{isImageOpen && isAnalysis && (
					<ClientPortal>
						<div
							onClick={() => setIsImageOpen(false)}
							className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center cursor-zoom-out"
						>
							<img
								src={analysisPost.image}
								className="max-w-full max-h-full object-contain p-4"
								alt="fullscreen-view"
							/>
						</div>
					</ClientPortal>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
