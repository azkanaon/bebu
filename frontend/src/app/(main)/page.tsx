"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import FeedTabs from "@/components/feed/FeedTabs";
import { useRouter } from "next/navigation";
import CreatePostBox from "@/components/feed/CreatePostBox";
import FeedList from "@/components/feed/FeedList";
import { ReviewPostType } from "@/types/post";
import { getPostsAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSearchParams } from "next/navigation";

export default function HomePage() {
	const [tab, setTab] = useState<"recommended" | "following">("recommended");
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const { user, isAuthenticated } = useAuthStore();
	
	// 🔥 store scroll position per tab
	const scrollPositions = useRef<Record<string, number>>({});
	
	// track tab sebelumnya
	const prevTabRef = useRef(tab);
	
	const [posts, setPosts] = useState<ReviewPostType[]>([]);
	const [cursor, setCursor] = useState(0);
	const [hasMore, setHasMore] = useState(true);

	// Direct to login page, jika user belum login dan buka tab following 
	useEffect(() => {
		if (tab === "following" && !isAuthenticated) {
			router.push("/login");
		}
	}, [tab, isAuthenticated, router]);

	const searchParams = useSearchParams();
	const categoryId = searchParams.get("category_id");

	// Fetch data post berdasarkan tab
	const fetchPosts = useCallback(
		async (isInitial = false) => {
			if (tab === "following" && !isAuthenticated) return;
			if (loading) return;

			window.dispatchEvent(
				new CustomEvent("app-loading", { detail: true }),
			);
			setLoading(true);

			try {
				// 1. Tentukan cursor yang akan dikirim
				// Jika initial (tab pindah/kategori berubah), pakai 0. Jika load more, pakai state cursor saat ini.
				const cursorToFetch = isInitial ? 0 : cursor;

				const response = await getPostsAPI(
					tab,
					cursorToFetch,
					10,
					categoryId ? parseInt(categoryId) : null, // Tambahkan parameter kategori
				);

				const newPosts = response || [];

				if (isInitial) {
					// Reset total jika initial fetch
					setPosts(newPosts);
					setHasMore(newPosts.length === 10);
					// Update cursor ke ID post terakhir untuk fetch berikutnya
					if (newPosts.length > 0) {
						setCursor(newPosts[newPosts.length - 1].id);
					}
				} else {
					// Append data jika load more
					setPosts((prev) => {
						const existingIds = new Set(prev.map((p) => p.id));
						const uniqueNewPosts = newPosts.filter(
							(p: ReviewPostType) => !existingIds.has(p.id),
						);
						return [...prev, ...uniqueNewPosts];
					});
					setHasMore(newPosts.length === 10);
					// Update cursor ke ID post terakhir dari batch baru
					if (newPosts.length > 0) {
						setCursor(newPosts[newPosts.length - 1].id);
					}
				}
			} catch (err) {
				console.error("Fetch Error:", err);
			} finally {
				// Gunakan requestAnimationFrame agar sidebar tidak loncat
				requestAnimationFrame(() => {
					setLoading(false);
					window.dispatchEvent(
						new CustomEvent("app-loading", { detail: false }),
					);
				});
			}
		},
		[tab, loading, isAuthenticated, cursor, categoryId],
	);

	useEffect(() => {
		const initFetch = async () => {
			await fetchPosts(true);
		};

		initFetch();
	}, [tab, categoryId]);

	// Track Scroll
	useEffect(() => {
		const handleScroll = () => {
			scrollPositions.current[tab] = window.scrollY;
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [tab]);

	// Handle Tab Switch
	useEffect(() => {
		const prevTab = prevTabRef.current;

		// simpan posisi tab sebelumnya
		scrollPositions.current[prevTab] = window.scrollY;

		const nextScroll = scrollPositions.current[tab];

		// kasih delay dikit biar data render dulu
		requestAnimationFrame(() => {
			if (nextScroll !== undefined) {
				window.scrollTo({ top: nextScroll });
			} else {
				window.scrollTo({ top: 0 });
			}
		});

		prevTabRef.current = tab;
	}, [tab]);

	return (
		<div className="max-w-2xl mx-auto space-y-4">
			<FeedTabs tab={tab} setTab={setTab} />

			<CreatePostBox />

			{/* 🔥 Loading state */}
			{tab === "following" &&
			isAuthenticated &&
			posts.length === 0 &&
			!loading ? (
				<div className="relative flex items-center justify-center py-24 px-6 overflow-hidden">
					{/* Background glow */}
					<div className="absolute w-[420px] h-[420px] bg-blue-500/10 blur-3xl rounded-full" />

					<div
						className="
				relative
				w-full
				max-w-xl
				rounded-3xl
				border border-white/10
				bg-white/[0.03]
				backdrop-blur-xl
				p-10
				text-center
				shadow-[0_0_60px_rgba(0,0,0,0.45)]
			"
					>
						{/* Floating Icon */}
						<div className="mb-6 flex justify-center">
							<div
								className="
						flex items-center justify-center
						w-20 h-20
						rounded-2xl
						bg-gradient-to-br
						from-blue-500/20
						to-violet-500/20
						border border-white/10
						backdrop-blur-md
						animate-float
					"
							>
								<span className="text-4xl">📚</span>
							</div>
						</div>

						{/* Heading */}
						<h3 className="text-3xl font-bold tracking-tight text-white">
							Your following feed is empty
						</h3>

						{/* Description */}
						<p className="mt-4 text-gray-400 leading-relaxed max-w-md mx-auto">
							Follow thoughtful readers, reviewers, and book
							lovers to build a personalized feed filled with
							insights, discussions, and recommendations.
						</p>

						{/* CTA Buttons */}
						<div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
							<button
								onClick={() => setTab("recommended")}
								className="
						px-5 py-3
						rounded-xl
						bg-blue-500
						text-white
						font-medium
						transition-all duration-300
						hover:bg-blue-400
						hover:scale-[1.02]
						active:scale-[0.98]
						shadow-lg shadow-blue-500/20
					"
							>
								Discover People
							</button>

							<button
								onClick={() => setTab("recommended")}
								className="
						px-5 py-3
						rounded-xl
						border border-white/10
						bg-white/[0.03]
						text-gray-300
						font-medium
						transition-all duration-300
						hover:bg-white/[0.06]
						hover:text-white
					"
							>
								Explore Posts
							</button>
						</div>

						{/* Small decorative text */}
						<div className="mt-8 text-xs text-gray-500 tracking-wide">
							Curated reviews • Deep discussions • Better reading
						</div>
					</div>
				</div>
			) : (
				<FeedList
					tab={tab}
					posts={posts}
					hasMore={hasMore}
					loading={loading}
					onLoadMore={() => {
						if (posts.length > 0 && !loading) {
							fetchPosts(false);
						}
					}}
				/>
			)}

			{/* Opsional: Jika benar-benar kosong (fetch pertama kali) baru tampilkan skeleton */}
			{loading && posts.length === 0 && (
				<div className="text-center text-gray-400 py-6">
					Loading initial posts...
				</div>
			)}
		</div>
	);
}
