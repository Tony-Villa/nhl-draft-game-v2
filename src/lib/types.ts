export interface Prospect {
	rank: string;
	name: string | undefined;
	position: string | undefined;
	nation: string | undefined;
	team: string;
	league: string;
	birthDay: string;
	height: string;
	weight: string;
	shoots: string;
	drafted: boolean;
}

export interface DraftBoard {
	draftPosition: number;
	teamLogo: string | undefined;
	prospect: Prospect | null;
	teamName: string | undefined;
}

export interface User {
	name: string;
	email: string;
	keys: string[];
	avatarUrl: string;
	id: string;
}

export interface PositionFilter {
	[key: string]: boolean;
}

export type AlertMessageType = {
	alertType: 'success' | 'error' | 'warning' | 'info';
	alertText: string;
};
