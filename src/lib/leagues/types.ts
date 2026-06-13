export type LeagueStanding = {
	userId: string;
	userName: string | null;
	userAvatar: string | null;
	role: string;
	selectedDraftBoardId: number;
	score: number | null;
};
