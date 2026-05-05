"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	MoreVertical,
	Flag,
	EyeOff,
	Link,
	UserX,
} from "lucide-react";

export default function PostMenu() {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (!ref.current?.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div className="relative" ref={ref}>
			{/* Trigger */}
			<button
				onClick={() => setOpen(!open)}
				className="p-2 rounded-full hover:bg-gray-800 transition"
			>
				<MoreVertical size={20} />
			</button>

			{/* Dropdown */}
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: 8, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 8, scale: 0.95 }}
						transition={{ duration: 0.15 }}
						className="
							absolute right-0 mt-2 w-52
							bg-gray-900/90 backdrop-blur-md
							border border-gray-800
							rounded-xl
							shadow-[0_10px_40px_rgba(0,0,0,0.5)]
							overflow-hidden
							z-50
						"
					>

						{/* Copy Link */}
						<MenuItem icon={<Link size={16} />} label="Copy link" />

						{/* Divider */}
						<div className="h-px bg-gray-800 my-1" />

						{/* Hide */}
						<MenuItem
							icon={<EyeOff size={16} />}
							label="Not interested"
							color="hover:text-yellow-400"
						/>

						{/* Mute / Block */}
						<MenuItem
							icon={<UserX size={16} />}
							label="Mute user"
							color="hover:text-orange-400"
						/>

						{/* Divider */}
						<div className="h-px bg-gray-800 my-1" />

						{/* Report */}
						<MenuItem
							icon={<Flag size={16} />}
							label="Report"
							color="hover:text-red-400"
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

function MenuItem({
	icon,
	label,
	color = "hover:text-white",
}: {
	icon: React.ReactNode;
	label: string;
	color?: string;
}) {
	return (
		<button
			className={`
				w-full flex items-center gap-3 px-4 py-2.5
				text-sm text-gray-300
				hover:bg-gray-800/70
				transition
				${color}
			`}
		>
			<span className="opacity-80">{icon}</span>
			<span>{label}</span>
		</button>
	);
}
