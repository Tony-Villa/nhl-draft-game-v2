import { redis } from '$lib/server/redis';
import { PROSPECTS_URL, CURRENT_STANDINGS } from '$env/static/private';
// import { janStandingsData } from '../../static/janStandings';
import * as cheerio from 'cheerio';
import type { DraftBoard, Prospect } from '$lib/types';
import { type RequestEvent } from '@sveltejs/kit';
import { drafts } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';

const CACHE_TTL = 86_400_000; // 24 hours

export const load = async ({ request, setHeaders, locals }: RequestEvent) => {
	const cached = await redis.get('top_prospects');
	let topProspects: Prospect[] = [];


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
				if (count > 100) {
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

	let draftBoard: DraftBoard[] = [];

	if(locals?.user) {
		draftBoard = await setInitialDraftBoard(locals?.user?.id)
	} else {
		draftBoard = await setInitialDraftBoard()
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

	const emptyDraftBoard = await setInitialDraftBoard()

	return { prospects: topProspects , draftBoard, user: locals, isAuthenticated: locals.session !== null, emptyDraftBoard };
}

async function setInitialDraftBoard(userId: string | undefined = undefined) {
	const draftboard = [];
	let count = 1;
	const response = await fetch(CURRENT_STANDINGS);
	const data = await response.json();

	for (let i = data.standings.length - 1; i >= 0; i--) {
		draftboard.push({
			draftPosition: count,
			teamName: data.standings[i]?.teamName?.default,
			// teamLogo: data.standings[i]?.teamLogo.replace('light', 'dark'),
			teamLogo: data.standings[i]?.teamLogo,
			prospect: null
		});
		count++;
	}

	if(userId) { 
		const savedDraftBoard = await db
		.select()
		.from(drafts)
		.where(eq(drafts.userId, userId));

		if(savedDraftBoard.length > 0) {
			for (let i = 0; i < savedDraftBoard.length; i++) {
				draftboard[savedDraftBoard[i].positionDrafted - 1].prospect = JSON.parse(savedDraftBoard[i].prospect as string);
			}
		}
	 }


	return draftboard || {};
}
