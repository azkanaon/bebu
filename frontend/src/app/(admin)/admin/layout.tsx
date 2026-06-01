"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/leftbar/Sidebar";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import CreatePostModal from "@/components/feed/CreatePostModal";

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
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

	if (!user) return <div className="text-white p-6">Loading...</div>;

	return (
		<>
			{/* Ditambahkan items-start agar koordinat Y atas terkunci sejajar dari awal */}
			<div className="flex w-full min-h-screen px-4 lg:px-8 gap-8 justify-start items-start">
				{/* Background App */}
				<div
					className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
					style={{ backgroundImage: "url('/images/bg_desktop.png')" }}
				/>

				{/* Left Sidebar */}
				<aside
					className="
						hidden lg:block

						w-84
						flex-shrink-0

						sticky
						top-0

						h-screen

						z-10
					"
				>
					<Sidebar user={user} />
				</aside>

				{/* Main Content */}
				<main className="flex-1 w-full max-w-[1050px] z-10 min-h-[100vh]">
					{children}
				</main>
			</div>

			<CreatePostModal />
			<Toaster
				position="top-center"
				toastOptions={{
					style: {
						background: "#09090B",
						color: "#F4F4F5",
						border: "1px solid rgba(255,255,255,0.1)",
						fontSize: "12px",
						borderRadius: "12px",
					},
					success: {
						iconTheme: {
							primary: "#10B981", // Default warna hijau emerald untuk semua toast sukses
							secondary: "#09090B",
						},
					},
					error: {
						iconTheme: {
							primary: "#EF4444", // Default warna merah untuk semua toast gagal
							secondary: "#09090B",
						},
					},
				}}
			/>
		</>
	);
}