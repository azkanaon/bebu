"use client";

import {
	MoreVertical,
	LogOut,
	Settings,
	User,
} from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

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
								src={user.avatar}
								alt="avatar"
								width={40}
								height={40}
								className="rounded-full object-cover border-2 border-white/30   /* ✅ thicker border */"
							/>

							{/* Presence */}
							<span
								className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${statusColor}
                border-2 border-[#0B1120] rounded-full`}
							/>
						</div>

						{/* Name */}
						<div className="leading-tight">
							<div className="text-[13px] font-semibold text-white">
								{user.name}
							</div>
							<div className="text-[11px] text-gray-400">
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

						<button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10">
							<LogOut size={16} />
							Logout
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
