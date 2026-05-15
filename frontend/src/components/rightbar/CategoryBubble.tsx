"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Category } from "@/types/category";
import { useRouter, useSearchParams } from "next/navigation";
import { getUserCategoriesAPI, unfavoriteCategoryAPI } from "@/lib/api";

export function CategoryBubble({
	onAddClick,
	refresh,
}: {
	onAddClick: () => void;
	refresh: boolean;
}) {
	const [categories, setCategories] = useState<Category[]>([]);
	const router = useRouter();
    const searchParams = useSearchParams();
    
    // Ambil category_id dari URL (jika ada)
    const activeCategoryId = searchParams.get("category_id");

	useEffect(() => {
		const loadUserFavs = async () => {
			try {
				const data = await getUserCategoriesAPI();
				if (Array.isArray(data)) setCategories(data);
			} catch (err: unknown) {
				setCategories([]);
			}
		};
		loadUserFavs();
	}, [refresh]);

	const handleCategoryClick = (id: number) => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (activeCategoryId === id.toString()) {
            params.delete("category_id"); // Toggle off jika diklik lagi
        } else {
            params.set("category_id", id.toString());
        }
        
        router.push(`?${params.toString()}`);
    };

	const handleRemove = async (id: number) => {
		try {
			// Gunakan API helper yang sudah kita buat di api.ts
			await unfavoriteCategoryAPI(id);

			// Update state lokal: hapus kategori dari list bubble
			setCategories((prev) => prev.filter((c) => c.id !== id));

			// Jika kategori yang dihapus sedang aktif sebagai filter, hapus dari URL
			if (activeCategoryId === id.toString()) {
				const params = new URLSearchParams(searchParams.toString());
				params.delete("category_id");
				router.push(`?${params.toString()}`);
			}

			toast.success("Removed");
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to remove";
			toast.error(errorMessage);
		}
	};

	return (
		<div
			className="
			bg-right-bar
			border border-white/10
			p-4 rounded-2xl
			shadow-xl
		"
		>
			<h2 className="font-semibold text-lg mb-3 text-white/90">
				🎯 Your Categories
			</h2>

			<div className="flex flex-wrap gap-2">
				{categories.map((c) => {
					const isActive = activeCategoryId === c.id.toString();

					return (
						<div
							key={c.id}
							onClick={() => handleCategoryClick(c.id)}
							className={`
								relative group
								px-3 py-1.5
								rounded-full text-sm
								cursor-pointer
								select-none

								transition-all duration-200 ease-out

								${
									isActive
										? "bg-my text-white shadow-md scale-105"
										: `
											bg-white/5 text-white/80
											hover:bg-white/10
											hover:scale-105
											active:scale-95
										`
								}
							`}
						>
							{/* Glow effect */}
							<div
								className="
								absolute inset-0 rounded-full
								bg-white/10 opacity-0
								group-hover:opacity-100
								transition
							"
							/>

							{/* Text */}
							<span className="relative z-10">{c.name}</span>

							{/* REMOVE BUTTON */}
							<span
								onClick={(e) => {
									e.stopPropagation();
									handleRemove(c.id);
								}}
								className="
									absolute -top-1 -right-1
									w-4 h-4 flex items-center justify-center
									text-[10px]
									rounded-full

									bg-red-400 text-white
									hover:bg-red-600

									opacity-0 scale-75
									group-hover:opacity-100 group-hover:scale-100

									transition-all duration-200 ease-out
									active:scale-90
								"
							>
								✕
							</span>
						</div>
					);
				})}

				{/* ADD BUTTON */}
				{categories.length < 10 && (
					<div
						onClick={onAddClick}
						className="
							px-3 py-1.5 rounded-full
							text-sm cursor-pointer
							border border-dashed border-white/20
							text-white/60

							hover:bg-white/10 hover:text-white
							transition-all duration-200
							active:scale-95
						"
					>
						+
					</div>
				)}
			</div>
		</div>
	);
}
