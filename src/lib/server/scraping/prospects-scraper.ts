import { PROSPECTS_URL, PROSPECT_COUNT } from '$env/static/private';
import * as cheerio from 'cheerio';
import type { Prospect } from '$lib/types';
import { redis } from '$lib/server/redis';

const SCRAPING_CACHE_TTL = 86_400_000; // 24 hours

/**
 * Scrape prospects from external source as fallback
 * This is kept as backup in case database fails
 */
export async function scrapeProspects(setHeaders?: (headers: Record<string, string>) => void): Promise<Prospect[]> {
	const cacheKey = 'scraped_prospects';
	
	try {
		// Check cache first
		const cached = await redis.get(cacheKey);
		if (cached) {
			const ttl = await redis.ttl(cacheKey);
			if (setHeaders && ttl > 0) {
				setHeaders({
					'cache-control': `max-age=${ttl}`
				});
			}
			return JSON.parse(cached);
		}

		// Scraping prospects from external source
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
					shoots
				});
			});
		});

		// Cache the result
		await redis.set(cacheKey, JSON.stringify(prospects), 'PX', SCRAPING_CACHE_TTL);
		
		return prospects;
		
	} catch (error) {
		console.error('Error scraping prospects:', error);
		return [];
	}
}
