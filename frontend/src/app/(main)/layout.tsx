"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/leftbar/Sidebar";
import RightSidebar from "@/components/rightbar/RightSidebar";

type User = {
	id: number;
	email: string;
	role: "user" | "admin";
	name: string;
	username: string;
	avatar: string;
};

export default function Layout({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		fetch("http://localhost:8080/api/me")
			.then((res) => res.json())
			.then((data) => setUser(data));
	}, []);

	if (!user) return <div>Loading...</div>;

	return (
		<div className="flex justify-center">
			{/* LEFT SIDEBAR */}
			<aside className="w-84 hidden lg:block">
				<div className="sticky top-0 h-screen">
					<Sidebar user={user} />
				</div>
			</aside>

			{/* MAIN CONTENT */}
			<main className="flex-1 max-w-[600px]">{children}</main>

			{/* RIGHT SIDEBAR */}
			<aside className="w-84 hidden xl:block">
				<div className="sticky top-0 h-screen overflow-y-auto">
					<RightSidebar />
				</div>
			</aside>
		</div>
	);
}
