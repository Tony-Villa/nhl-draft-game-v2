import { auth } from "$lib/server/auth";
import { redirect, type Actions } from "@sveltejs/kit";
import type { RequestEvent } from "../$types";

import { CURRENT_GAME } from '$env/static/private';
import type { DraftBoard, Prospect } from '$lib/types';
import { getCachedDraftBoardOrder } from "$lib/server/cache/draft-board-cache.js";
import { getInitialProspects } from "$lib/server/services/prospects-service.js";
import {
	getUserDraftBoardCells,
	getUserDraftBoards,
	mergePicksIntoDraftBoard
} from "$lib/server/services/draft-board-service.js";
import { leaguesAndBoardsEnabled } from '$lib/server/feature-flags.js';

export const load = async ({ setHeaders, locals, fetch, url }: RequestEvent) => {
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
			Number(game.year),
			12,
			setHeaders
		);
	}

	let draftBoard: DraftBoard[] = [];
	const featureEnabled = leaguesAndBoardsEnabled();
	const gameIsEditable =
		game?.gamePhase === 'open' && Date.now() < new Date(game.lockDate).getTime();
	const selectedDraftBoardId = featureEnabled && gameIsEditable
		? Number(url.searchParams.get('board')) || undefined
		: undefined;
	let selectedDraftBoard = null;
	let userDraftBoards: Awaited<ReturnType<typeof getUserDraftBoards>> = [];

	if(locals?.user) {
		let baseDraftBoard: DraftBoard[];
		
		if (game?.gamePhase === 'finalized') {
			baseDraftBoard = await getCachedDraftBoardOrder(true, game.year);
		} else {
			baseDraftBoard = await getCachedDraftBoardOrder();
		}
		
		const { board, picks: userDraftData } = await getUserDraftBoardCells(
			locals.user.id,
			CURRENT_GAME,
			selectedDraftBoardId
		);

		selectedDraftBoard = board;
		if (featureEnabled) {
			userDraftBoards = await getUserDraftBoards(locals.user.id, CURRENT_GAME);
		}
		
		if (userDraftData.length > 0) {
			draftBoard = mergePicksIntoDraftBoard(baseDraftBoard, userDraftData);
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
		selectedDraftBoard,
		userDraftBoards,
		leaguesAndBoardsEnabled: featureEnabled,
		canSwitchDraftBoards: featureEnabled && gameIsEditable,
		user: locals, 
		isAuthenticated: locals.session !== null, 
		nhlBoard, 
		game, 
		ladder 
	};
}

export const actions: Actions = {
	logout: async ({ request }) => {
		await auth.api.signOut({
			headers: request.headers
		});

		throw redirect(303, '/draft-center');
	},
};
