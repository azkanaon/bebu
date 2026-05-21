"use client";

import { useState, useEffect } from "react";
import { getBookPostsAPI } from "@/lib/api";
import { BookReviewPostType, BookAnalysisPostType } from "@/types/book";
import BookProfilePostCard from "./BookProfilePostCard";
import BookProfileCreatePostBox from "./BookProfileCreatePostBox"; // IMPORT BOX BARU
import { Loader2, MessageSquare, BarChart2 } from "lucide-react";

type PostsSectionProps = {
	slug: string;
	bookTitle: string;
	bookId: number;
};

export default function BookProfilePostsSection({
	slug,
	bookTitle,
	bookId,
}: PostsSectionProps) {
	const [activeTab, setActiveTab] = useState<"review" | "analysis">("review");
	const [posts, setPosts] = useState<
		(BookReviewPostType | BookAnalysisPostType)[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchTabPosts = async () => {
			setIsLoading(true);
			try {
				const response = await getBookPostsAPI(slug, activeTab);
				if (response?.status === "success" || response?.data) {
					setPosts(response.data || []);
				} else {
					setPosts([]);
				}
			} catch (error) {
				console.error("Gagal memuat postingan buku:", error);
				setPosts([]);
			} finally {
				setIsLoading(false);
			}
		};

		fetchTabPosts();
	}, [slug, activeTab]);

	return (
		<div className="w-full space-y-5 pt-2">
			{/* TAB CONTROLLER */}
			<div className="flex items-center border-b border-white/[0.06]">
				<button
					onClick={() => setActiveTab("review")}
					className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative ${
						activeTab === "review"
							? "text-blue-400"
							: "text-gray-400 hover:text-gray-200"
					}`}
				>
					<MessageSquare size={16} />
					Review
					{activeTab === "review" && (
						<div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500" />
					)}
				</button>
				<button
					onClick={() => setActiveTab("analysis")}
					className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative ${
						activeTab === "analysis"
							? "text-blue-400"
							: "text-gray-400 hover:text-gray-200"
					}`}
				>
					<BarChart2 size={16} />
					Analysis
					{activeTab === "analysis" && (
						<div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500" />
					)}
				</button>
			</div>

			{/* FAKE INPUT POST BOX KONTEKSTUAL */}
			<BookProfileCreatePostBox
				activeTab={activeTab}
				bookTitle={bookTitle}
				bookId={bookId}
			/>

			{/* POSTS CONTENT AREA */}
			{isLoading ? (
				<div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-2">
					<Loader2 className="animate-spin text-blue-500" size={20} />
					<span className="text-xs">Memuat postingan...</span>
				</div>
			) : posts.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/[0.04] rounded-2xl bg-slate-950/10">
					<p className="text-sm text-gray-400 font-medium">
						Belum ada {activeTab}
					</p>
					<p className="text-xs text-gray-600 mt-1">
						Jadilah yang pertama membagikan pendapatmu tentang buku
						ini.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4">
					{posts.map((post) => (
						<BookProfilePostCard key={post.id} post={post} />
					))}
				</div>
			)}
		</div>
	);
}
