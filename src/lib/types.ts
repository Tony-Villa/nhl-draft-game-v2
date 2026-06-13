export interface Prospect {
	id?: string; // Prospect ID for tracking (matches DB type)
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
}

export interface DraftBoard {
	draftPosition: number;
	teamLogo: string | undefined;
	prospect: Prospect | null;
	teamName: string | undefined;
	from?: string | undefined;
	points: number | null;
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

// Draft Insights Types
export interface DraftInsightProspect {
	prospectId: string;
	name: string;
	position: string;
	team: string;
	percentage: number;
	targetPositionCount: number;
	avgPosition: number;
	draftRange: string;
	mostCommonPosition: number;
	consistency: 'HIGH' | 'MEDIUM' | 'LOW';
	heatmapData: Record<number, number>;
}

export interface DraftInsightsData {
	targetPosition: number;
	gameId: string;
	prospects: DraftInsightProspect[];
}
