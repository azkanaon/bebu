"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type User = {
	id: number;
	name: string;
	username: string;
	avatar: string;
};

export function FriendRecommendation() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("http://localhost:8080/api/users/recommendation")
			.then((res) => res.json())
			.then((data) => setUsers(data))
			.catch((err) => console.error(err))
			.finally(() => setLoading(false));
	}, []);

	return (
		<div className="bg-white/5 p-4 rounded-xl">
			<h2 className="font-semibold mb-3">Friend Recommendation</h2>

			{/* Loading */}
			{loading && <p className="text-sm text-gray-400">Loading...</p>}

			{/* Kosong */}
			{!loading && users.length === 0 && (
				<p className="text-sm text-gray-400">No recommendations</p>
			)}

			{/* Data */}
			{users.map((u) => (
				<div
					key={u.id}
					className="flex items-center justify-between mb-3"
				>
					<div className="flex items-center gap-3">
						<Image
							src={u.avatar}
							alt="avatar"
							width={40}
							height={40}
							className="rounded-full object-cover border-2 border-white/30"
						/>
						<div>
							<p className="font-medium">{u.name}</p>
							<p className="text-sm text-gray-400">
								@{u.username}
							</p>
						</div>
					</div>

					<button className="bg-blue-500 px-3 py-1 rounded-full text-sm">
						Follow
					</button>
				</div>
			))}
		</div>
	);
}