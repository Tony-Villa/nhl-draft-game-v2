export interface Prospect {
	rank: string;
	name: string;
	position: string;
	nation: string | undefined;
	team: string;
	league: string;
	birthDay: string;
	height: string;
	weight: string;
	shoots: string;
}

export interface DraftBoard {
	draftPosition: number;
	teamLogo: string | undefined;
	prospect: Prospect | null;
}
