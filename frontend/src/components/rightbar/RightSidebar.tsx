import { useState } from "react";
import { FriendRecommendation } from "./FriendRecommendation";
import { TrendingBooks } from "./TrendingBooks";
import { CategoryBubble } from "./CategoryBubble";
import { CategoryModal } from "./CategoryModal";
import { Leaderboard } from "./Leaderboard";
import { Footer } from "./Footer";

export default function RightSidebar() {
	const [isOpen, setIsOpen] = useState(false);
	const [refresh, setRefresh] = useState(false);

	return (
		<div className="space-y-4 p-4">
			<FriendRecommendation />

			<CategoryBubble
				onAddClick={() => setIsOpen(true)}
				refresh={refresh}
			/>

			<TrendingBooks />
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
