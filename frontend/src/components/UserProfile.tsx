"use client";

import { MoreVertical } from "lucide-react";
import Image from "next/image";

type Props = {
	user: {
		name: string;
		username: string;
		avatar: string;
	};
};

export default function UserProfile({ user }: Props) {
	return (
		<div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
			<div className="flex items-center gap-3">
				<Image
					src={user.avatar}
					alt="avatar"
					width={40}
					height={40}
					className="rounded-full object-cover"
				/>
				<div>
					<div className="text-sm font-semibold">{user.name}</div>
					<div className="text-xs text-gray-400">
						@{user.username}
					</div>
				</div>
			</div>

			<button className="text-gray-400 hover:text-white">
				<MoreVertical size={18} />
			</button>
		</div>
	);
}
