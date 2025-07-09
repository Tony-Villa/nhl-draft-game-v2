import { lucia } from "$lib/server/auth";
import { deleteSessionCookie } from "$lib/server/authUtils";
import { redirect, type Actions } from "@sveltejs/kit";
import type { RequestEvent } from "../$types";

import { CURRENT_GAME } from '$env/static/private';
import type { DraftBoard, Prospect } from '$lib/types';
import { getCachedDraftBoardOrder } from "$lib/server/cache/draft-board-cache.js";
import { getInitialProspects } from "$lib/server/services/prospects-service.js";
import { db } from '$lib/server/db/index.js';
import { drafts, prospects } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const load = async ({ setHeaders, locals, fetch }: RequestEvent) => {
	const response = await fetch('/api/game')
	const game = await response.json()
	
	const nhlBoardRes = await fetch('api/nhl-board?game=' + CURRENT_GAME)
	const nhlBoard = await nhlBoardRes.json()

	let ladder;
	if(game?.gamePhase && game?.gamePhase === 'finalized' ){
		const ladderRes = await fetch('api/ladder')
		ladder = await ladderRes.json()
	}

	let topProspects: Prospect[] = [];
	if(game?.gamePhase !== 'finalized') {
		topProspects = await getInitialProspects(
			new Date().getFullYear(), 
			12,
			setHeaders
		);
	}

	let draftBoard: DraftBoard[] = [];
	if(locals?.user) {
		let baseDraftBoard: DraftBoard[];
		
		if (game?.gamePhase === 'finalized') {
			baseDraftBoard = await getCachedDraftBoardOrder(true, game.year);
		} else {
			baseDraftBoard = await getCachedDraftBoardOrder();
		}
		
		const userDraftData = await db
			.select({
				draftPosition: drafts.positionDrafted,
				team: drafts.team,
				points: drafts.points,
				prospectId: drafts.prospectId,
				prospectRank: prospects.rank,
				prospectName: prospects.name,
				prospectPosition: prospects.position,
				prospectNation: prospects.nation,
				prospectTeam: prospects.team,
				prospectLeague: prospects.league,
				prospectBirthDay: prospects.birthDay,
				prospectHeight: prospects.height,
				prospectWeight: prospects. weight,
				prospectShoots: prospects.shoots,
				prospectDraftYear: prospects.draftYear
			})
			.from(drafts)
			.leftJoin(prospects, eq(drafts.prospectId, prospects.id))
			.where(
				and(
					eq(drafts.userId, locals.user.id),
					eq(drafts.gameId, CURRENT_GAME)
				)
			)
			.orderBy(drafts.positionDrafted);
		
		if (userDraftData.length > 0) {
			const userDraftPicks = userDraftData.map(draft => ({
				draftPosition: draft.draftPosition,
				teamName: draft.team,
				teamLogo: undefined,
				points: draft.points,
				prospect: draft.prospectId ? {
					id: draft.prospectId,
					rank: draft.prospectRank,
					name: draft.prospectName,
					position: draft.prospectPosition,
					nation: draft.prospectNation,
					team: draft.prospectTeam,
					league: draft.prospectLeague,
					birthDay: draft.prospectBirthDay,
					height: draft.prospectHeight?.toString() || '',
					weight: draft.prospectWeight?.toString() || '',
					shoots: draft.prospectShoots
				} as Prospect : null
			}));
			
			draftBoard = baseDraftBoard.map(basePosition => {
				const userPick = userDraftPicks.find(pick => pick.draftPosition === basePosition.draftPosition);
				if (userPick) {
					return {
						...basePosition,
						...userPick,
						teamLogo: basePosition.teamLogo
					};
				}
				return basePosition;
			});
		} else {
			draftBoard = baseDraftBoard;
		}
	} else {
		if (game?.gamePhase === 'finalized') {
			draftBoard = await getCachedDraftBoardOrder(true, game.year);
		} else {
			draftBoard = await getCachedDraftBoardOrder();
		}
	}

	return { 
		prospects: topProspects, 
		draftBoard, 
		user: locals, 
		isAuthenticated: locals.session !== null, 
		nhlBoard, 
		game, 
		ladder 
	};
}

export const actions: Actions = {
	logout: async ({ cookies, locals }) => {
		if (!locals.session?.id) return;

		await lucia.invalidateSession(locals.session.id);

		await deleteSessionCookie(lucia, cookies);

		throw redirect(303, '/draft-center');
	},
};

