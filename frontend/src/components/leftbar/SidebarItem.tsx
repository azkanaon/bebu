"use client";

import Link from "next/link";

type Props = {
	icon: React.ReactNode;
	label: string;
	href: string;
	currentPathname?: string; // 🔥 Tambahkan prop baru ini untuk menerima pathname efektif
};

export function SidebarItem({ icon, label, href, currentPathname }: Props) {
	// 🔥 Ganti 'pathname' (yang dikembalikan usePathname) dengan 'currentPathname' dari induk
	// Kita pastikan ada fallback string kosong jika prop lupa/tidak terkirim
	const targetPathname = currentPathname || "";

	// Logika pencocokan aktif disesuaikan menggunakan targetPathname
	const isActive =
		targetPathname === href || targetPathname.startsWith(href + "/");

	return (
		<div className="relative">
			{/* Active Indicator */}
			{isActive && (
				<div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full" />
			)}

			<Link
				href={href}
				className={`flex items-center gap-3 p-3 rounded-lg 
        transition-all duration-200 ease-out transform
        ${
			isActive
				? "bg-white/10 text-white font-medium shadow-[0_0_12px_rgba(59,130,246,0.25)]"
				: "text-gray-400 hover:bg-white/5 hover:text-white hover:scale-[1.03]"
		}`}
			>
				{/* Icon */}
				<span
					className={`transition-colors ${
						isActive ? "text-blue-400" : "text-gray-400"
					}`}
				>
					{icon}
				</span>

				{/* Label */}
				<span className="text-sm">{label}</span>
			</Link>
		</div>
	);
}
