// src/app/(main)/post/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getPostByPublicIdAPI } from "@/lib/api";
import { AnalysisPostType, ReviewPostType } from "@/types/post";
import CommentModal from "@/components/feed/CommentModal";

export default function PostDetailPage() {
	const params = useParams();
	const router = useRouter();
	const publicId = params.id as string;

	const [post, setPost] = useState<AnalysisPostType | ReviewPostType | null>(
		null,
	);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadPost() {
			try {
				const data = await getPostByPublicIdAPI(publicId);
				setPost(data);
			} catch (err) {
				console.error("Gagal load post detail:", err);
			} finally {
				setLoading(false);
			}
		}
		if (publicId) loadPost();
	}, [publicId]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[50vh] text-gray-400">
				<p className="text-sm">Memuat diskusi buku...</p>
			</div>
		);
	}

	if (!post) return null;

	return (
		// Pembungkus ini memastikan komponen memiliki tinggi yang pas dengan kolom tengah layout Anda
		<div className="w-full flex-1 flex flex-col">
			<CommentModal
				postId={post.id}
				post={post}
				type={post.type}
				isStandalonePage={true}
				onClose={() => router.push("/")}
			/>
		</div>
	);
}