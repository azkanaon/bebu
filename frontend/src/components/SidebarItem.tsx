"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
	icon: React.ReactNode;
	label: string;
	href: string;
};

export default function SidebarItem({ icon, label, href }: Props) {
	const pathname = usePathname();
	const isActive = pathname === href;

	return (
		<Link
			href={href}
			className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
				isActive
					? "bg-blue-600 text-white"
					: "hover:bg-gray-800 text-gray-300"
			}`}
		>
			{icon}
			<span className="text-sm">{label}</span>
		</Link>
	);
}
