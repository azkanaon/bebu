"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Category = {
	id: number;
	name: string;
};

export function CategoryBubble({
	onAddClick,
	refresh,
}: {
	onAddClick: () => void;
	refresh: boolean;
}) {
	const [categories, setCategories] = useState<Category[]>([]);
	const [activeCategory, setActiveCategory] = useState<number | null>(null);

	useEffect(() => {
		fetch("http://localhost:8080/api/v1/categories/user")
			.then((res) => res.json())
			.then((data) => {
				if (Array.isArray(data)) setCategories(data);
				else setCategories([]);
			})
			.catch(() => setCategories([]));
	}, [refresh]);

	const handleRemove = async (id: number) => {
		const res = await fetch(
			`http://localhost:8080/api/v1/categories/${id}/favorite`,
			{ method: "DELETE" },
		);

		if (!res.ok) {
			toast.error("Failed to remove");
			return;
		}

		setCategories((prev) => prev.filter((c) => c.id !== id));

		if (activeCategory === id) setActiveCategory(null);

		toast.success("Removed");
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
					const isActive = activeCategory === c.id;

					return (
						<div
							key={c.id}
							onClick={() =>
								setActiveCategory(isActive ? null : c.id)
							}
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

									bg-red-500 text-white
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
