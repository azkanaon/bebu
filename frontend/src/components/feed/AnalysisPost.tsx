"use client";

import { motion } from "framer-motion";
import { AnalysisPostType } from "@/types/post";
import PostMenu from "./PostMenu";
import { ThumbsUp, MessageCircle, Share2, Bookmark } from "lucide-react";

type Props = {
	post: AnalysisPostType;
};

export default function AnalysisPost({ post }: Props) {
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

				<PostMenu />
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
						className="flex items-center gap-1 hover:text-blue-400 transition"
					>
						<ThumbsUp size={18} />
						<span>{post.likes}</span>
					</motion.button>

					<motion.button
						whileTap={{ scale: 0.9 }}
						className="flex items-center gap-1 hover:text-green-400 transition"
					>
						<MessageCircle size={18} />
						<span>{post.comments}</span>
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
					whileTap={{ scale: 0.9 }}
					className="text-gray-400 hover:text-yellow-400 transition"
				>
					<Bookmark size={18} />
				</motion.button>
			</div>
		</motion.div>
	);
}
