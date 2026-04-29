"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/leftbar/Sidebar";
import RightSidebar from "@/components/rightbar/RightSidebar";
import CreatePostModal from "@/components/feed/CreatePostModal";
import { Toaster } from "react-hot-toast";
import { usePostModal } from "@/stores/postModal";

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

	// Zustand state
	const isOpen = usePostModal((s) => s.isOpen);
	const close = usePostModal((s) => s.close);

	// Fetch user
	useEffect(() => {
		fetch("http://localhost:8080/api/v1/users/me")
			.then((res) => res.json())
			.then((data) => setUser(data))
			.catch(() => setUser(null));
	}, []);

	// Lock scroll saat modal kebuka
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "auto";
		}

		// cleanup (important)
		return () => {
			document.body.style.overflow = "auto";
		};
	}, [isOpen]);

	if (!user) return <div>Loading...</div>;

	return (
		<>
			<div className="flex justify-center gap-6 min-h-screen">
				{/* Background */}
				<div
					className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
					style={{ backgroundImage: "url('/images/bg_desktop.png')" }}
				/>

				{/* Left Sidebar */}
				<aside className="w-84 hidden lg:block">
					<div className="sticky top-0 h-screen">
						<Sidebar user={user} />
					</div>
				</aside>

				{/* Main Content */}
				<main className="flex-1 max-w-[600px] z-10">{children}</main>

				{/* Right Sidebar */}
				<aside className="w-84 hidden xl:block">
					<div className="sticky top-0">
						<RightSidebar />
					</div>
				</aside>
			</div>

			{/* GLOBAL MODAL */}
			<CreatePostModal />

			{/* TOASTER */}
			<Toaster position="top-center" />
		</>
	);
}
