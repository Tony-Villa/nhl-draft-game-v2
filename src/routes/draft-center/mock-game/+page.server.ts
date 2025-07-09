import { lucia } from "$lib/server/auth";
import { deleteSessionCookie } from "$lib/server/authUtils";
import { redirect, type Actions } from "@sveltejs/kit";
import type { RequestEvent } from "../$types";

import type { DraftBoard, Prospect } from '$lib/types';
import { getCachedDraftBoardOrder } from "$lib/server/cache/draft-board-cache.js";
import { getInitialProspects } from "$lib/server/services/prospects-service.js";
import { db } from '$lib/server/db/index.js';
import { games, prospects, nhlDraft } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load = async ({ setHeaders, locals, fetch }: RequestEvent) => {
	const [mostRecentFinalizedGame] = await db
		.select()
		.from(games)
		.where(eq(games.gamePhase, 'finalized'))
		.orderBy(desc(games.year))
		.limit(1);

	if (!mostRecentFinalizedGame) {
		throw redirect(303, '/draft-center');
	}

	const finalizedGameProspects = await db
		.select()
		.from(prospects)
		.where(eq(prospects.draftYear, parseInt(mostRecentFinalizedGame.year)))
		.orderBy(prospects.rank);

	const nhlDraftResults = await db
		.select({
			positionDrafted: nhlDraft.positionDrafted,
			prospectId: nhlDraft.prospectId,
			prospectName: nhlDraft.prospectName,
			prospect: prospects
		})
		.from(nhlDraft)
		.leftJoin(prospects, eq(nhlDraft.prospectId, prospects.id))
		.where(eq(nhlDraft.gameId, parseInt(mostRecentFinalizedGame.id)))
		.orderBy(nhlDraft.positionDrafted);

	function shuffleArray<T>(array: T[]): T[] {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	const randomizedNhlDraft = [...nhlDraftResults];
	
	if (randomizedNhlDraft.length >= 5) {
		const group2to5 = shuffleArray(randomizedNhlDraft.slice(1, 5));
		randomizedNhlDraft.splice(1, 4, ...group2to5);
	}
	
	if (randomizedNhlDraft.length >= 10) {
		const group6to10 = shuffleArray(randomizedNhlDraft.slice(5, 10));
		randomizedNhlDraft.splice(5, 5, ...group6to10);
	}
	
	if (randomizedNhlDraft.length >= 20) {
		const group11to20 = shuffleArray(randomizedNhlDraft.slice(10, 20));
		randomizedNhlDraft.splice(10, 10, ...group11to20);
	}
	
	if (randomizedNhlDraft.length >= 32) {
		const group21to32 = shuffleArray(randomizedNhlDraft.slice(20, 32));
		randomizedNhlDraft.splice(20, 12, ...group21to32);
	}

	const mockGameProspects: Prospect[] = finalizedGameProspects.map(prospect => ({
		id: prospect.id,
		rank: prospect.rank || '0',
		name: prospect.name,
		position: prospect.position || undefined,
		nation: prospect.nation || undefined,
		team: prospect.team,
		league: prospect.league,
		birthDay: prospect.birthDay,
		height: prospect.height?.toString() || '',
		weight: prospect.weight?.toString() || '',
		shoots: prospect.shoots
	}));

	const baseDraftBoard = await getCachedDraftBoardOrder(true, mostRecentFinalizedGame.year);
	
	const mockDraftBoard: DraftBoard[] = baseDraftBoard.map(position => ({
		...position,
		prospect: null,
		points: null
	}));

	const mockGame = {
		id: `mock-${mostRecentFinalizedGame.id}`,
		year: mostRecentFinalizedGame.year,
		gamePhase: 'mock',
		draftDaySet: true,
		lockDate: new Date().toISOString(),
		startDate: new Date().toISOString(),
		endDate: new Date().toISOString()
	};

	const mockNhlBoard = baseDraftBoard.map(position => ({
		...position,
		prospect: null
	}));

	return { 
		prospects: mockGameProspects,
		draftBoard: mockDraftBoard,
		user: locals, 
		isAuthenticated: locals.session !== null,
		nhlBoard: mockNhlBoard,
		randomizedNhlDraft,
		game: mockGame,
		finalizedGameYear: mostRecentFinalizedGame.year
	};
}

export const actions: Actions = {
	logout: async ({ cookies, locals }) => {
		if (!locals.session?.id) return;

		await lucia.invalidateSession(locals.session.id);

		await deleteSessionCookie(lucia, cookies);

		throw redirect(303, '/draft-center/mock-game');
	},
};
