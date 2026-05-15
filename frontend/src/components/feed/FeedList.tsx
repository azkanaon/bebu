"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import PostCard from "./PostCard";
import { ReviewPostType, AnalysisPostType } from "@/types/post";

type PostType = ReviewPostType | AnalysisPostType;

type Props = {
	tab: "recommended" | "following";
	posts: PostType[];
	hasMore: boolean;
	loading: boolean;
	onLoadMore: () => void;
};

export default function FeedList({
	tab,
	posts,
	hasMore,
	loading,
	onLoadMore,
}: Props) {
	const { ref, inView } = useInView({
		threshold: 0,
		// 🔥 Trigger 200px sebelum elemen sentinel benar-benar muncul di viewport
		rootMargin: "0px 0px 2000px 0px",
	});

	useEffect(() => {
		if (inView && hasMore && !loading && posts.length > 0) {
			onLoadMore();
		}
	}, [inView, hasMore, loading, onLoadMore, posts.length]);

	return (
		<div className="flex flex-col gap-4">
			<AnimatePresence mode="popLayout">
				<motion.div
					key={tab}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="space-y-4"
				>
					{posts.map((post) => (
						<motion.div
							key={post.id}
							layout // Menjaga transisi posisi tetap smooth
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
						>
							<PostCard post={post} />
						</motion.div>
					))}
				</motion.div>
			</AnimatePresence>

			{posts.length > 0 && (
				<div
					ref={ref}
					className={`${hasMore ? "h-20" : "h-0"} w-full flex items-center justify-center transition-all duration-300`}
				>
					{loading && (
						<div className="flex gap-2">
							<span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
							<span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
							<span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
						</div>
					)}
				</div>
			)}
		</div>
	);
}
