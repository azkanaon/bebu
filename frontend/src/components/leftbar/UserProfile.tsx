"use client";

import {
	MoreVertical,
	LogOut,
	Settings,
	User,
} from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
	user: {
		name: string;
		username: string;
		avatar: string;
		status?: "online" | "idle" | "offline";
	};
};

export function UserProfile({ user }: Props) {
	const [open, setOpen] = useState(false);
	const [expand, setExpand] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	const router = useRouter();
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	
	const handleLogout = async () => {
		if (isLoggingOut) return;

		setIsLoggingOut(true);
		try {
			const response = await fetch(
				"http://localhost:8080/api/v1/auth/logout",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					// WAJIB: Agar browser mengirimkan cookie refresh_token ke Go
					credentials: "include",
				},
			);

			if (response.ok) {
				// Opsional: hapus sisa-sisa state di client side jika ada
				// localStorage.clear();

				// Redirect ke login dan refresh state aplikasi
				router.push("/login");
				router.refresh();
			} else {
				const errorData = await response.json();
				console.error("Logout failed:", errorData.error);
				alert("Gagal logout, silakan coba lagi.");
			}
		} catch (error) {
			console.error("Network error during logout:", error);
		} finally {
			setIsLoggingOut(false);
		}
	};

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
				setExpand(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const statusColor = {
		online: "bg-green-500",
		idle: "bg-yellow-400",
		offline: "bg-gray-500",
	}[user.status || "online"];

	return (
		<div className="mt-4 relative">
			<div ref={ref} className="relative z-10">
				{/* PROFILE ROW */}
				<div
					className="group flex items-center justify-between px-3 py-2 rounded-xl
          hover:bg-white/5
          transition-all duration-200
          hover:scale-[1.03]   /* ✅ hover scale */
          active:scale-[0.98]
          cursor-pointer"
					onClick={() => setExpand(!expand)}
				>
					{/* LEFT */}
					<div className="flex items-center gap-3">
						<div className="relative">
							<Image
								src={
									user.avatar ||
									`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
								}
								alt={user.name}
								width={40}
								height={40}
								className="rounded-full object-cover border-2 border-white/30"
								unoptimized
							/>

							{/* Presence */}
							<span
								className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${statusColor}
                border-2 border-[#0B1120] rounded-full`}
							/>
						</div>

						{/* Name */}
						<div className="leading-normal">
							<div className="text-sm font-semibold text-white">
								{user.name}
							</div>
							<div className="text-xs text-gray-400">
								@{user.username}
							</div>
						</div>
					</div>

					{/* RIGHT ACTION */}
					<div className="flex items-center gap-2">
						<button
							onClick={(e) => {
								e.stopPropagation();
								setOpen(!open);
							}}
							className="text-gray-400 hover:text-white transition"
						>
							<MoreVertical size={18} />
						</button>
					</div>
				</div>

				{/* DROPDOWN */}
				{open && (
					<div
						className="absolute left-4 right-4 bottom-16 rounded-xl
            bg-[#0f172a]/95 backdrop-blur-xl
            border border-white/10
            shadow-2xl
            overflow-hidden
            animate-in fade-in zoom-in-95"
					>
						<button className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-white/10">
							<User size={16} />
							Profile
						</button>

						<button className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-white/10">
							<Settings size={16} />
							Settings
						</button>

						<div className="border-t border-white/10" />

						<button
							onClick={handleLogout}
							disabled={isLoggingOut}
							className={`flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 ${isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}`}
						>
							<LogOut size={16} />
							{isLoggingOut ? "Logging out..." : "Logout"}
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
