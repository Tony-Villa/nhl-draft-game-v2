import { lucia } from "$lib/server/auth";
import { deleteSessionCookie } from "$lib/server/authUtils";
import { redirect, type Actions } from "@sveltejs/kit";
import type { RequestEvent } from "../$types";

import { redis } from '$lib/server/redis';
import { PROSPECTS_URL, PROSPECT_COUNT } from '$env/static/private';
import * as cheerio from 'cheerio';
import type { DraftBoard, Prospect } from '$lib/types';
import { getDraftBoardOrder } from "$lib/helpers/get-draft-board-order";


const CACHE_TTL = 86_400_000; // 24 hours

export const load = async ({ request, setHeaders, locals, fetch }: RequestEvent) => {
	const response = await fetch('/api/game')
	const game = await response.json()
	
	const nhlBoardrRes = await fetch('api/board')
	const nhlBoard = await nhlBoardrRes.json()

	let ladder;
	
	if(game?.gamePhase && game?.gamePhase === 'finalized' ){
		const ladderRes = await fetch('api/ladder')
		ladder = await ladderRes.json()
	}


	

	const cached = await redis.get('top_prospects');
	let topProspects: Prospect[] = [];

	if(game?.gamePhase !== 'finalized') {
		if (cached) {
			const ttl = await redis.ttl(CACHE_TTL.toString());
			if (!request.headers.get('cache-control')) {
				setHeaders({
					'cache-control': `max-age=${ttl}`
				});
			}
			topProspects = JSON.parse(cached);
		} else {
			const prospects: Prospect[] = [];
			let count = 0;
			const response = await fetch(PROSPECTS_URL);
			const data = await response.text();
			const $ = cheerio.load(data);
			const $tbody = $('table tbody');
			$tbody.each((i, tbody) => {
				const $tr = $(tbody).find('tr');
				$tr.each((j, tr) => {
					let rank = $(tr).find('.rank').text().trim();
					if (!rank) {
						return;
					}
					// top 100 only
					count++;
					if (count > +PROSPECT_COUNT) {
						return;
					}
	
					if (rank.includes('-')) {
						rank = (count).toString();
					}
	
					const name = $(tr)
						.find('.player')
						.text()
						.trim()
						.match(/^[^(]+/)?.[0]
						.trim();
					const position = $(tr)
						.find('.player')
						.text()
						.match(/\(([^)]+)\)/)?.[1]
						.trim();
	
					const nation = $(tr).find('.nation > i > img').attr('src');
					const team = $(tr).find('.team').text().trim();
					const league = $(tr).find('.league > .txt-blue').text().trim();
					const birthDay = $(tr).find('.date-of-birth > .hidden-xs').text().trim();
					const height = $(tr).find('.height').text().trim();
					const weight = $(tr).find('.weight').text().trim();
					const shoots = $(tr).find('.shoots').text().trim();
					prospects.push({
						rank,
						name,
						position,
						nation,
						team,
						league,
						birthDay,
						height,
						weight,
						shoots,
						drafted: false
					});
				});
			});
			topProspects = prospects;
			redis.set('top_prospects', JSON.stringify(topProspects), 'PX', CACHE_TTL);
		}
	}

	let draftBoard: DraftBoard[] = [];

	if(locals?.user) {
		
		
		draftBoard = await setInitialDraftBoard(locals?.user?.id, fetch) as DraftBoard[]
	} else {
		draftBoard = await setInitialDraftBoard() as DraftBoard[]
	}

	draftBoard.forEach((draftPick) => {
		if (draftPick.prospect) {
			const draftedProspect = draftPick.prospect;
			for (const prospect of topProspects) {
				if (prospect.name === draftedProspect.name) {
					prospect.drafted = true;
				}
			}
		}
	})

	return { prospects: topProspects , draftBoard, user: locals, isAuthenticated: locals.session !== null, nhlBoard, game, ladder };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setInitialDraftBoard(userId: string | undefined = undefined, fetch: any | undefined = undefined) {


	const draftboard = await getDraftBoardOrder()

	if(userId) {
		try {
			const response = await fetch(`/api/userBoard?board=${userId}`)
			const savedDraftBoard = await response.json()
	

			if(savedDraftBoard.length > 0) {
				for (let i = 0; i < savedDraftBoard.length; i++) {
					if(draftboard) {
						draftboard[savedDraftBoard[i].positionDrafted - 1].prospect = JSON.parse(savedDraftBoard[i].prospect as string);
					}
				}
			}
			
		} catch (error) {
			console.error(error);
		}
	 }

	return draftboard || {};
}


export const actions: Actions = {
	logout: async ({ cookies, locals }) => {
		if (!locals.session?.id) return;

		await lucia.invalidateSession(locals.session.id);

		await deleteSessionCookie(lucia, cookies);

		throw redirect(303, '/draft-center');
	},
};

