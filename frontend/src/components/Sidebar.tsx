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
import SidebarItem from "./SidebarItem";
import UserProfile from "./UserProfile";

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
		<div className="h-screen w-64 bg-[#0B1120] text-white flex flex-col justify-between px-4 py-6">
			{/* TOP SECTION */}
			<div>
				{/* LOGO */}
				<div className="flex items-center gap-2 mb-10">
					<div className="text-2xl">📘</div>
					<span className="text-xl font-bold">BeBu</span>
				</div>

				{/* SEARCH */}
				<div className="mb-6">
					<div className="flex items-center bg-gray-800 rounded-lg px-3 py-2">
						<Search size={18} className="mr-2 text-gray-400" />
						<input
							type="text"
							placeholder="Search..."
							className="bg-transparent outline-none text-sm w-full"
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
							<div className="mt-4 text-xs text-gray-400">
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

			{/* BOTTOM USER PROFILE */}
			<UserProfile user={user} />
		</div>
	);
}
