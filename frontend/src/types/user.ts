export interface FriendRecommendationItem {
	id: number;
	name: string;
	username: string;
	avatar: string;
	bio: string;
	total_followers: number;
	total_following: number;

	match_score: number;
	mutual_score: number;
	genre_score: number;
	activity_score: number;
}
