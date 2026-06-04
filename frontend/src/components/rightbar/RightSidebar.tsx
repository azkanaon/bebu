import { useState } from "react";
import { usePathname } from "next/navigation";

import { FriendRecommendation } from "./FriendRecommendation";
import { TrendingBooks } from "./TrendingBooks";
import { CategoryBubble } from "./CategoryBubble";
import { CategoryModal } from "./CategoryModal";
import { Leaderboard } from "./Leaderboard";
import { Footer } from "./Footer";

export default function RightSidebar() {
	const pathname = usePathname();

	const [isOpen, setIsOpen] = useState(false);
	const [refresh, setRefresh] = useState(false);

	return (
		<div className="space-y-4 pr-8 my-4">
			{!pathname.includes("/post/") && <FriendRecommendation />}

			{pathname !== "/books" &&
				!pathname.includes("/books/") &&
				!pathname.includes("/post/") && (
					<CategoryBubble
						onAddClick={() => setIsOpen(true)}
						refresh={refresh}
					/>
				)}
			{pathname !== "/books" && <TrendingBooks />}
			<Leaderboard />
			<Footer />

			{isOpen && (
				<CategoryModal
					onClose={() => setIsOpen(false)}
					onUpdate={() => setRefresh((p) => !p)}
				/>
			)}
		</div>
	);
}
