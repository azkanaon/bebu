"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

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
		<div className="flex">
			<Sidebar user={user} />
			<main className="flex-1">{children}</main>
		</div>
	);
}
