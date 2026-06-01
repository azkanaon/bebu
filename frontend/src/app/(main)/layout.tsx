// src/app/(main)/layout.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/leftbar/Sidebar";
import RightSidebar from "@/components/rightbar/RightSidebar";
import CreatePostModal from "@/components/feed/CreatePostModal";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/stores/useAuthStore";

type Props = {
	children: React.ReactNode;
	modal: React.ReactNode; // 1. Tambahkan prop modal di sini
};

export default function Layout({ children, modal }: Props) {
	// ... (Sisa kode useEffect, state, dan logic Anda biarkan tetap sama) ...
	const searchParams = useSearchParams();
	const currentTab = searchParams.get("tab");
	const disableSidebarScroll = useRef(false);
	const [offset, setOffset] = useState(0);
	const [isResetting, setIsResetting] = useState(false);
	const { user } = useAuthStore();

	const [isAppLoading, setIsAppLoading] = useState(false);
	useEffect(() => {
		const handleLoadingEvent = (e: Event) => {
			const customEvent = e as CustomEvent;
			setIsAppLoading(customEvent.detail);
		};

		window.addEventListener("app-loading", handleLoadingEvent);
		return () =>
			window.removeEventListener("app-loading", handleLoadingEvent);
	}, []);

	useEffect(() => {
		let lastScrollY = window.scrollY;

		const handleScroll = () => {
			const sidebar = document.getElementById("right-sidebar");
			if (!sidebar || disableSidebarScroll.current || isAppLoading)
				return;

			const sidebarHeight = sidebar.offsetHeight;
			const viewportHeight = window.innerHeight;
			const currentScrollY = window.scrollY;

			const padding = 16;
			if (sidebarHeight + padding * 2 <= viewportHeight) {
				setOffset(0);
				lastScrollY = currentScrollY;
				return;
			}

			const delta = currentScrollY - lastScrollY;
			const maxScrollTop =
				sidebarHeight + padding - (viewportHeight - padding);

			setOffset((prev) => {
				let next = prev + delta;
				if (next < 0) next = 0;
				if (next > maxScrollTop) next = maxScrollTop;
				return next;
			});

			lastScrollY = currentScrollY;
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [disableSidebarScroll, isAppLoading]);

	useEffect(() => {
		let timer: NodeJS.Timeout;

		disableSidebarScroll.current = true;

		requestAnimationFrame(() => {
			setIsResetting(true);
			setOffset(0);

			timer = setTimeout(() => {
				setIsResetting(false);
				disableSidebarScroll.current = false;
			}, 300);
		});

		return () => clearTimeout(timer);
	}, [currentTab]);

	useEffect(() => {
		requestAnimationFrame(() => {
			setOffset(0);
		});
	}, [currentTab]);

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
				<main className="flex flex-col flex-1 w-full max-w-[600px] z-0 px-3 sm:px-0 min-h-screen h-fit">
					{children}
				</main>

				{/* Right Sidebar */}
				<aside className="w-84 hidden xl:block relative">
					<div
						id="right-sidebar"
						className="sticky top-4 h-fit"
						style={{
							transform: `translateY(-${offset}px)`,
							transition: isResetting
								? "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)"
								: "none",
						}}
					>
						<RightSidebar />
					</div>
				</aside>
			</div>

			{/* 2. Render slot modal di luar struktur layout utama agar bertindak sebagai overlay */}
			{modal}

			{/* GLOBAL MODAL */}
			<CreatePostModal />

			{/* TOASTER */}
			<Toaster position="top-center" />
		</>
	);
}
