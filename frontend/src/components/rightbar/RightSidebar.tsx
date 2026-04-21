import { FriendRecommendation } from "./FriendRecommendation";
import { TrendingBooks } from "./TrendingBooks";
import { CategoryBubble } from "./CategoryBubble";
import { Leaderboard } from "./Leaderboard";
import { Footer } from "./Footer";

export default function RightSidebar() {
	return (
		<aside className="w-80 hidden xl:block">
			<div className="sticky top-0 space-y-4 p-4">
				<FriendRecommendation />
				<TrendingBooks />
				<CategoryBubble />
				<Leaderboard />
				<Footer />
			</div>
		</aside>
	);
}
