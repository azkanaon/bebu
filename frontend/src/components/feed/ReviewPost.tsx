"use client";

import { motion } from "framer-motion";
import { ReviewPostType } from "@/types/post";
import { ThumbsUp, MessageCircle, Share2, Bookmark, Star } from "lucide-react";
import PostMenu from "./PostMenu";

type Props = {
	post: ReviewPostType;
};

export default function ReviewPost({ post }: Props) {
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
					<motion.div
						whileTap={{ scale: 0.9 }}
						className="flex items-center gap-1 cursor-pointer hover:text-blue-400 transition"
					>
						<ThumbsUp size={18} />
						<span>{post.likes}</span>
					</motion.div>

					<motion.div
						whileTap={{ scale: 0.9 }}
						className="flex items-center gap-1 cursor-pointer hover:text-green-400 transition"
					>
						<MessageCircle size={18} />
						<span>{post.comments}</span>
					</motion.div>

					<motion.div
						whileTap={{ scale: 0.9 }}
						className="flex items-center gap-1 cursor-pointer hover:text-purple-400 transition"
					>
						<Share2 size={18} />
						<span>{post.shares}</span>
					</motion.div>
				</div>

				<motion.div
					whileTap={{ scale: 0.9 }}
					className="cursor-pointer text-gray-400 hover:text-yellow-400 transition"
				>
					<Bookmark size={18} />
				</motion.div>
			</div>
		</motion.div>
	);
}
