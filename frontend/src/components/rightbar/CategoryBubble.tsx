"use client";

import { useEffect, useState } from "react";

type Category = {
	id: number;
	name: string;
};

export function CategoryBubble() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("http://localhost:8080/api/categories/user")
			.then((res) => res.json())
			.then((data) => {
				if (Array.isArray(data)) {
					setCategories(data);
				} else {
					setCategories([]);
				}
			})
			.catch(() => setCategories([]))
			.finally(() => setLoading(false));
	}, []);

	if (!Array.isArray(categories)) {
		return <div>Loading...</div>;
	}

	return (
		<div className="bg-white/5 p-4 rounded-xl">
			<h2 className="font-semibold mb-3">Your Categories</h2>

			{loading && <p className="text-sm text-gray-400">Loading...</p>}

			<div className="flex flex-wrap gap-2">
				{Array.isArray(categories) && categories.length > 0 ? (
					categories.map((c) => (
						<span
							key={c.id}
							className="px-3 py-1 bg-white/10 rounded-full text-sm hover:bg-white/20 cursor-pointer"
						>
							#{c.name}
						</span>
					))
				) : (
					<p className="text-sm text-gray-400">No categories</p>
				)}
			</div>
		</div>
	);
}
