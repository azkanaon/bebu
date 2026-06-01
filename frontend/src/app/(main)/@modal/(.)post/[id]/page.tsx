"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CommentModal from "@/components/feed/CommentModal";
import { getPostByPublicIdAPI } from "@/lib/api";
import { AnalysisPostType, ReviewPostType } from "@/types/post";

export default function PostModalIntercept() {
	const router = useRouter();
	const params = useParams();

	// params.id mengambil nilai dari folder [id], yaitu public_id postingan
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
				console.error("Gagal memuat detail post:", err);
			} finally {
				setLoading(false);
			}
		}
		if (publicId) loadPost();
	}, [publicId]);

	if (loading || !post) return null; // Bisa diganti skeleton loading tipis

	return (
		<CommentModal
			postId={post.id} // ID internal untuk mutasi data (like/comment)
			post={post}
			type={post.type}
			onClose={() => router.back()} // Klik silang/backdrop otomatis kembali ke URL feed (/)
		/>
	);
}
