import { redis } from '$lib/server/redis';
import type { PageServerLoad } from './$types';
import { PROSPECTS_URL, CURRENT_STANDINGS } from '$env/static/private';
// import { janStandingsData } from '../../static/janStandings';
import * as cheerio from 'cheerio';
import type { Prospect } from '$lib/types';

const CACHE_TTL = 86_400_000; // 24 hours

export const load: PageServerLoad = async ({ setHeaders }) => {
	const cached = await redis.get('top_prospects');
	let topProspects;
	if (cached) {
		console.log('CACHE HIT: top_prospects');
		const ttl = await redis.ttl(CACHE_TTL.toString());
		setHeaders({ 'cache-control': `max-age=${ttl}` });
		topProspects = JSON.parse(cached);
	} else {
		console.log('CACHE MISS: top_prospects');
		const prospects: Prospect[] = [];
		let count = 0;
		const response = await fetch(PROSPECTS_URL);
		const data = await response.text();
		const $ = cheerio.load(data);
		const $tbody = $('table tbody');
		$tbody.each((i, tbody) => {
			const $tr = $(tbody).find('tr');
			$tr.each((i, tr) => {
				const rank = $(tr).find('.rank').text().trim();
				if (!rank) {
					return;
				}
				// top 100 only
				count++;
				if (count > 100) {
					return;
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

	const draftboard = await setInitialDraftBoard();

	return { prospects: topProspects, draftboard };
};

async function setInitialDraftBoard() {
	// console.log('initial draft board');
	const draftboard = [];
	let count = 1;
	const response = await fetch(CURRENT_STANDINGS);
	const data = await response.json();
	// const data = janStandingsData;

	for (let i = data.standings.length - 1; i >= 0; i--) {
		draftboard.push({
			draftPosition: count,
			teamLogo: data.standings[i]?.teamLogo.replace('light', 'dark'),
			prospect: null
		});
		count++;
	}

	return draftboard || {};
}
