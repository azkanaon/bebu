"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Layers, EyeOff, Trash2 } from "lucide-react";

import { getPostManagementAPIs } from "@/lib/api";
import {
    PostManageableResponse,
	PostQueryParams,
} from "@/types/post-management";

import PostFilterBar from "@/components/post-management/PostFilterBar";
import PostTable from "@/components/post-management/PostTable";
import PostStatusModal from "@/components/post-management/PostStatusModal";

export default function PostManagementPage() {
	const [posts, setPosts] = useState<PostManageableResponse[]>([]);
	const [loading, setLoading] = useState(true);

	// State untuk kontrol modal penanganan status postingan
	const [selectedPost, setSelectedPost] =
		useState<PostManageableResponse | null>(null);

	// State Pagination Metadata
	const [totalCount, setTotalCount] = useState<number>(0);
	const [totalPages, setTotalPages] = useState<number>(1);

	// Filter State Grouping (Dipetakan langsung ke PostQueryParams)
	const [filters, setFilters] = useState<PostQueryParams>({
		search: "",
		publish_status: "", // Default menampilkan semua status publikasi
		page: 1,
		limit: 10,
	});

	const handleFilterChange = (
		key: keyof PostQueryParams,
		value: string | number,
	) => {
		setFilters((prev) => ({
			...prev,
			[key]: value,
			page: key === "page" ? (value as number) : 1, // Reset ke halaman 1 jika filter non-page berubah
		}));
	};

	const fetchPosts = useCallback(async () => {
		setLoading(true);
		try {
			const response = await getPostManagementAPIs(filters);

			// Memetakan properti snake_case database dari Go DTO response
			setPosts(response.data);
			setTotalCount(response.total_rows);
			setTotalPages(response.total_pages);
		} catch (err) {
			console.error(
				"Failed to load admin post management dashboard",
				err,
			);
		} finally {
			setLoading(false);
		}
	}, [filters]);

	// Efek samping untuk reload data dengan trigger debounce 300ms saat mengetik kata kunci pencarian
	useEffect(() => {
		const delayDebounce = setTimeout(() => {
			fetchPosts();
		}, 300);

		return () => clearTimeout(delayDebounce);
	}, [filters.search, filters.publish_status, filters.page, fetchPosts]);

	return (
		<div className="relative min-h-screen overflow-hidden">
			{/* Ambient Background Glow */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute top-[-120px] right-[15%] h-[320px] w-[320px] rounded-full bg-blue-500/10 blur-3xl" />
				<div className="absolute bottom-[-150px] left-[10%] h-[280px] w-[280px] rounded-full bg-purple-500/10 blur-3xl" />
			</div>

			<div className="relative z-10 space-y-6 py-6">
				{/* HEADER */}
				<div className="flex items-start justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.3em] text-blue-400/70">
							Content Intelligence
						</p>

						<h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
							Post Records & Feed
						</h1>

						<p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
							Monitor global feeds, analyze user interactions,
							investigate book reviews, or restrict and purge
							non-compliant community publications across the
							platform.
						</p>
					</div>
				</div>

				{/* CONTENT BLOCK CONTAINER */}
				<div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
					<div className="space-y-5">
						{/* Filter bar untuk pencarian text dan drop-down status */}
						<PostFilterBar
							filters={filters}
							onFilterChange={handleFilterChange}
						/>

						{/* Data table render utama */}
						<PostTable
							data={posts}
							loading={loading}
							onSelect={(post) => setSelectedPost(post)}
							currentPage={filters.page}
							totalPages={totalPages}
							totalItems={totalCount}
							onPageChange={(newPage) =>
								handleFilterChange("page", newPage)
							}
						/>
					</div>
				</div>

				{/* MODAL POPUP MODERASI STATUS POST */}
				<PostStatusModal
					post={selectedPost}
					onClose={() => setSelectedPost(null)}
					onActionSuccess={fetchPosts}
				/>
			</div>
		</div>
	);
}
