export type TabType = "all_time" | "monthly";

export interface LeaderboardUser {
	user_id: number;
	username: string;
	display_name?: string;
	avatar_url?: string;
	rank: number;
	total_exp: number;
}

export interface LeaderboardResponse {
	period_type: string;
	period_key: string;
	data: LeaderboardUser[];
	my_rank: LeaderboardUser | null;
}
