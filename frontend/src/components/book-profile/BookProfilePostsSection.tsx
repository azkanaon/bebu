"use client";

import { useState, useEffect } from "react";
import { getBookPostsAPI } from "@/lib/api";

import { BookReviewPostType, BookAnalysisPostType } from "@/types/book";

import BookProfilePostCard from "./BookProfilePostCard";
import BookProfileCreatePostBox from "./BookProfileCreatePostBox";

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
		<section className="w-full">
			{/* HEADER */}
			<div className="mb-3">
				<h2 className="text-[22px] font-semibold tracking-tight text-white">
					Community Discussions
				</h2>

				<p className="text-[13px] leading-relaxed text-slate-400">
					Share reviews, thoughts, and deeper analysis about this
					book.
				</p>
			</div>

			{/* TABS */}
			<div
				className="
		flex
		w-full
		items-center
		gap-1
		rounded-xl
		border border-white/[0.06]
		bg-white/[0.03]
		backdrop-blur-xl
	"
			>
				<button
					onClick={() => setActiveTab("review")}
					className={`
			flex flex-1 items-center justify-center gap-2
			rounded-lg px-4 py-2.5
			text-sm font-medium
			transition-all duration-300
			${
				activeTab === "review"
					? "bg-blue-500/15 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.12)]"
					: "text-slate-400 hover:text-slate-200"
			}
		`}
				>
					<MessageSquare size={15} />
					Reviews
				</button>

				<button
					onClick={() => setActiveTab("analysis")}
					className={`
			flex flex-1 items-center justify-center gap-2
			rounded-xl px-4 py-2.5
			text-sm font-medium
			transition-all duration-300
			${
				activeTab === "analysis"
					? "bg-indigo-500/15 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.12)]"
					: "text-slate-400 hover:text-slate-200"
			}
		`}
				>
					<BarChart2 size={15} />
					Analysis
				</button>
			</div>

			{/* CREATE POST */}
			<div className="mt-3">
				<BookProfileCreatePostBox
					activeTab={activeTab}
					bookTitle={bookTitle}
					bookId={bookId}
				/>
			</div>

			{/* POSTS */}
			<div className="mt-3 mb-3">
				{isLoading ? (
					<div className="flex flex-col items-center justify-center py-16">
						<div
							className="
								flex h-11 w-11 items-center justify-center
								rounded-full border border-white/[0.06]
								bg-white/[0.03]
							"
						>
							<Loader2
								size={18}
								className="animate-spin text-blue-400"
							/>
						</div>

						<p className="mt-4 text-sm text-slate-500">
							Loading discussions...
						</p>
					</div>
				) : posts.length === 0 ? (
					<div
						className="
							rounded-2xl
							border border-dashed border-white/[0.06]
							bg-white/[0.02]
							px-6 py-12
							text-center
						"
					>
						<div
							className="
								mx-auto
								flex h-12 w-12 items-center justify-center
								rounded-full
								bg-white/[0.03]
								text-slate-500
							"
						>
							{activeTab === "review" ? (
								<MessageSquare size={18} />
							) : (
								<BarChart2 size={18} />
							)}
						</div>

						<h3 className="mt-4 text-sm font-medium text-slate-300">
							No {activeTab}s yet
						</h3>

						<p className="mt-1 text-xs leading-relaxed text-slate-500">
							Be the first to share your thoughts about this book.
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{posts.map((post) => (
							<BookProfilePostCard key={post.id} post={post} />
						))}
					</div>
				)}
			</div>
		</section>
	);
}
