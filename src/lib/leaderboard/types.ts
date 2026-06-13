export interface LeaderboardEntry {
	userId: string;
	userName: string | null;
	userAvatar: string | null;
	score: number;
}

export interface LiveLeaderboardData {
	leaderboard: LeaderboardEntry[];
	lastUpdated: string;
}

export interface LadderEntry {
	id: string;
	score: number;
	playerName: string | null;
	avatar: string | null;
	year: string;
}
