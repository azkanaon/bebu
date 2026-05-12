"use client";

import { useEffect, useRef, useState } from "react";
import FeedTabs from "@/components/feed/FeedTabs";
import CreatePostBox from "@/components/feed/CreatePostBox";
import FeedList from "@/components/feed/FeedList";
import { ReviewPostType } from "@/types/post";
import api from "@/lib/axios";

export default function HomePage() {
	const [tab, setTab] = useState<"recommended" | "following">("recommended");
	const [posts, setPosts] = useState<ReviewPostType[]>([]);
	const [loading, setLoading] = useState(false);

	// 🔥 store scroll position per tab
	const scrollPositions = useRef<Record<string, number>>({});

	// track tab sebelumnya
	const prevTabRef = useRef(tab);

	// =============================
	// 🚀 FETCH DATA (REAL API)
	// =============================
	useEffect(() => {
		const fetchPosts = async () => {
			setLoading(true);
			try {
				// Gunakan path relatif karena baseURL sudah di-set di axios.ts
				const endpoint =
					tab === "recommended" ? "v1/posts" : "v1/posts";

				const res = await api.get(endpoint);

				// Axios otomatis mem-parsing JSON, datanya ada di res.data
				setPosts(res.data);
			} catch (err: any) {
				console.error(
					"Failed to fetch posts:",
					err.response?.data || err.message,
				);
			} finally {
				setLoading(false);
			}
		};

		fetchPosts();
	}, [tab]);

	// =============================
	// 🧠 TRACK SCROLL
	// =============================
	useEffect(() => {
		const handleScroll = () => {
			scrollPositions.current[tab] = window.scrollY;
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [tab]);

	// =============================
	// 🔄 HANDLE TAB SWITCH
	// =============================
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
			{loading ? (
				<div className="text-center text-gray-400 py-6">
					Loading posts...
				</div>
			) : (
				<FeedList tab={tab} posts={posts} />
			)}
		</div>
	);
}
