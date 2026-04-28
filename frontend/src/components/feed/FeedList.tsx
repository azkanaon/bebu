"use client";

import { motion, AnimatePresence } from "framer-motion";
import PostCard from "./PostCard";
import { ReviewPostType, AnalysisPostType } from "@/types/post";

type PostType = ReviewPostType | AnalysisPostType;

type Props = {
	tab: "recommended" | "following";
	posts: PostType[];
};

export default function FeedList({ tab, posts }: Props) {
	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={tab}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -10 }}
				transition={{ duration: 0.25 }}
				className="space-y-4"
			>
				{posts.map((post, index) => (
					<motion.div
						key={post.id}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.2,
							delay: index * 0.05,
						}}
					>
						<PostCard post={post} />
					</motion.div>
				))}
			</motion.div>
		</AnimatePresence>
	);
}
