import { db } from '$lib/server/db/index.js';
import { prospects } from '$lib/server/db/schema';
import { eq, asc, sql } from 'drizzle-orm';
import type { Prospect } from '$lib/types';
import { scrapeProspects } from '../scraping/prospects-scraper.js';

/**
 * Get initial page of prospects from database, with scraping fallback
 */
export async function getInitialProspects(
	year: number = new Date().getFullYear(),
	limit: number = 100,
	setHeaders?: (headers: Record<string, string>) => void
): Promise<Prospect[]> {
	try {
		// Check database first
		
		// Try database first
		const prospectsData = await db
			.select({
				id: prospects.id,
				rank: prospects.rank,
				name: prospects.name,
				position: prospects.position,
				nation: prospects.nation,
				team: prospects.team,
				league: prospects.league,
				birthDay: prospects.birthDay,
				height: prospects.height,
				weight: prospects.weight,
				shoots: prospects.shoots,
				draftYear: prospects.draftYear
			})
			.from(prospects)
			.where(eq(prospects.draftYear, year))
			.orderBy(asc(sql`CAST(${prospects.rank} AS INTEGER)`))
			.limit(limit);

		if (prospectsData.length > 0) {
			// Format prospects data
			
			// Transform to match Prospect interface
			const transformedProspects: Prospect[] = prospectsData.map(prospect => ({
				id: prospect.id,
				rank: prospect.rank,
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

			return transformedProspects;
		} else {
			console.warn('No prospects found in database, falling back to scraping...');
		}
		
	} catch (error) {
		console.error('Database error, falling back to scraping:', error);
	}

	// Fallback to scraping
	return await scrapeProspects(setHeaders);
}

/**
 * Get prospect count from database
 */
export async function getProspectCount(year: number = new Date().getFullYear()): Promise<number> {
	try {
		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(prospects)
			.where(eq(prospects.draftYear, year));
		
		return result[0]?.count || 0;
	} catch (error) {
		console.error('Error getting prospect count:', error);
		return 0;
	}
}
