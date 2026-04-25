"use client";

import {
	Home,
	Book,
	MessageCircle,
	Bell,
	Search,
	Shield,
	Flag,
} from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import { UserProfile } from "./UserProfile";
import Image from "next/image";

type SidebarProps = {
	user: {
		name: string;
		username: string;
		avatar: string;
		role: "user" | "admin";
	};
};

export default function Sidebar({ user }: SidebarProps) {
	return (
		<div className="h-screen w-68 bg-auth-form text-white flex flex-col justify-between py-5 ml-16">
			{/* TOP SECTION */}
			<div className="px-4">
				{/* LOGO */}
				<div className="flex items-center gap-0 mb-5">
					<div className="relative h-10 w-10">
						<Image
							src="/logo.png"
							alt="BeBu Logo"
							fill // Menggunakan fill agar mengikuti ukuran container div-nya
							className="object-contain"
							priority
						/>
					</div>
					<span className="text-2xl font-bold tracking-tight bg-logo-gradient bg-clip-text text-transparent">
						BeBu
					</span>
				</div>

				{/* SEARCH */}
				<div className="mb-6">
					<div className="flex items-center bg-white/5 rounded-lg px-3 py-2 backdrop-blur-sm">
						<Search size={18} className="mr-2 text-gray-400" />
						<input
							type="text"
							placeholder="Search..."
							className="bg-transparent outline-none text-sm w-full placeholder:text-gray-500"
						/>
					</div>
				</div>

				{/* NAVIGATION */}
				<div className="flex flex-col gap-2">
					<SidebarItem
						icon={<Home size={20} />}
						label="Home"
						href="/"
					/>
					<SidebarItem
						icon={<Book size={20} />}
						label="List Book"
						href="/books"
					/>
					<SidebarItem
						icon={<MessageCircle size={20} />}
						label="Chat"
						href="/chat"
					/>
					<SidebarItem
						icon={<Bell size={20} />}
						label="Notification"
						href="/notifications"
					/>

					{/* ADMIN ONLY */}
					{user.role === "admin" && (
						<>
							<div className="mt-4 text-[10px] tracking-widest text-gray-500">
								ADMIN
							</div>
							<SidebarItem
								icon={<Shield size={20} />}
								label="Book Management"
								href="/admin/books"
							/>
							<SidebarItem
								icon={<Flag size={20} />}
								label="Report Management"
								href="/admin/reports"
							/>
						</>
					)}
				</div>
			</div>

			{/* 🔥 BOTTOM SECTION (FULL WIDTH + PREMIUM DIVIDER) */}
			<div className="relative mt-4">
				{/* ✨ Premium Divider */}
				<div className="relative">
					{/* main gradient line */}
					<div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

					{/* subtle glow */}
					<div className="absolute inset-0 h-px w-full blur-sm bg-white/20 opacity-60" />
				</div>

				{/* 🔥 Depth shadow (lebih rapat & halus) */}
				<div className="absolute left-0 right-0 h-4 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

				{/* User Profile */}
				<div className="px-4">
					<UserProfile user={user} />
				</div>
			</div>
		</div>
	);
}