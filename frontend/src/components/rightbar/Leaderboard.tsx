"use client";

import { useEffect, useState } from "react";

type User = {
	id: number;
	name: string;
	username: string;
	avatar: string;
	rank: number;
};

export function Leaderboard() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("http://localhost:8080/api/leaderboard")
			.then((res) => res.json())
			.then((data) => {
				if (Array.isArray(data)) {
					setUsers(data);
				} else {
					setUsers([]);
				}
			})
			.catch(() => setUsers([]))
			.finally(() => setLoading(false));
	}, []);

	return (
		<div className="bg-white/5 p-4 rounded-xl">
			<h2 className="font-semibold mb-3">Leaderboard</h2>

			{loading ? (
				<p className="text-sm text-gray-400">Loading...</p>
			) : users.length === 0 ? (
				<p className="text-sm text-gray-400">No data</p>
			) : (
				users.map((u, i) => (
					<div
						key={u.id}
						className="flex justify-between items-center mb-2"
					>
						<div className="flex gap-3 items-center">
							<span
								className={`font-bold ${
									i === 0
										? "text-yellow-400"
										: i === 1
											? "text-gray-300"
											: i === 2
												? "text-orange-400"
												: ""
								}`}
							>
								#{u.rank}
							</span>

							<div>
								<p>{u.name}</p>
								<p className="text-xs text-gray-400">
									@{u.username}
								</p>
							</div>
						</div>

						{/* nanti bisa diganti score */}
						<p className="text-sm">⭐</p>
					</div>
				))
			)}
		</div>
	);
}
