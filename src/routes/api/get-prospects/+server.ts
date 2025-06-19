import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { prospects } from '$lib/server/db/schema';
import { eq, desc, asc, like, and, sql } from 'drizzle-orm';
import type { Prospect } from '$lib/types.js';
import { redis } from '$lib/server/redis.js';

// Cache configuration
const CACHE_PREFIX = 'prospects:';
const CACHE_TTL = 86400; 
const MAX_CACHED_PAGES = 10; 

/**
 * Generate a cache key based on query parameters
 */
function generateCacheKey(params: {
	page: number;
	limit: number;
	search: string;
	position: string;
	sortBy: string;
	sortOrder: string;
	year: number;
}): string {
	const { page, limit, search, position, sortBy, sortOrder, year } = params;
	return `${CACHE_PREFIX}${year}:${sortBy}:${sortOrder}:${limit}:${encodeURIComponent(search)}:${encodeURIComponent(position)}:${page}`;
}

/**
 * Check if we should cache this request
 * Only cache first few pages to avoid excessive Redis usage
 */
function shouldCache(page: number, search: string): boolean {
	// Don't cache search results as they're highly variable
	if (search.trim()) return false;
	
	// Only cache first N pages
	return page <= MAX_CACHED_PAGES;
}

export async function GET({ url }: { url: URL }) {
	try {
		// Get query parameters
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '12');
		const search = url.searchParams.get('search') || '';
		const position = url.searchParams.get('position') || '';
		const sortBy = url.searchParams.get('sortBy') || 'rank';
		const sortOrder = url.searchParams.get('sortOrder') || 'asc';
		const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());

		// Generate cache key
		const cacheKey = generateCacheKey({
			page,
			limit,
			search,
			position,
			sortBy,
			sortOrder,
			year
		});

		// Try to get from cache first (if we should cache this request)
		if (shouldCache(page, search)) {
			try {
				const cachedResult = await redis.get(cacheKey);
				if (cachedResult) {
					return json(JSON.parse(cachedResult));
				}
			} catch (cacheError) {
				console.warn('Redis cache read error:', cacheError);
				// Continue with database query if cache fails
			}
		}

		const offset = (page - 1) * limit;

		let whereConditions = [eq(prospects.draftYear, year)];

		if (search) {
			whereConditions.push(
				like(prospects.name, `%${search}%`)
			);
		}

		if (position) {
			// Handle position filtering - support multiple positions separated by comma
			const positions = position.split(',').map((p: string) => p.trim());
			const positionConditions = positions.map((pos: string) => {
				if (pos === 'F') {
					// If searching for forwards, include C, LW, RW
					return sql`(${prospects.position} LIKE '%C%' OR ${prospects.position} LIKE '%LW%' OR ${prospects.position} LIKE '%RW%' OR ${prospects.position} LIKE '%F%')`;
				} else {
					return like(prospects.position, `%${pos}%`);
				}
			});
			
			if (positionConditions.length === 1) {
				whereConditions.push(positionConditions[0]);
			} else {
				whereConditions.push(sql`(${sql.join(positionConditions, sql` OR `)})`);
			}
		}

		let orderByClause;
		if (sortBy === 'rank') {
			// Cast rank to integer
			orderByClause = sortOrder === 'asc' 
				? asc(sql`CAST(${prospects.rank} AS INTEGER)`)
				: desc(sql`CAST(${prospects.rank} AS INTEGER)`);
		} else if (sortBy === 'name') {
			orderByClause = sortOrder === 'asc' ? asc(prospects.name) : desc(prospects.name);
		} else if (sortBy === 'height') {
			// Cast height to integer
			orderByClause = sortOrder === 'asc' ? asc(prospects.height) : desc(prospects.height);
		} else if (sortBy === 'age') {
			// Calculate precise age as decimal (e.g., 18.32)
			// This assumes birthDay format like "Mar 15, 2005" or "March 15, 2005"
			const currentDate = new Date();
			const currentYear = currentDate.getFullYear();
			const currentMonth = currentDate.getMonth() + 1; // getMonth() is 0-indexed
			const currentDay = currentDate.getDate();
			
			// Create a complex SQL expression to calculate precise age
			// We'll convert the current date to a decimal year (e.g., 2025.46 for mid-June)
			const currentDecimalYear = currentYear + (currentMonth - 1) / 12 + (currentDay - 1) / 365.25;
			
			// SQL to calculate age as decimal
			const ageCalculation = sql`
				${currentDecimalYear} - (
					CAST(substr(${prospects.birthDay}, -4) AS REAL) + 
					(CASE 
						WHEN ${prospects.birthDay} LIKE '%Jan%' OR ${prospects.birthDay} LIKE '%January%' THEN 0.0
						WHEN ${prospects.birthDay} LIKE '%Feb%' OR ${prospects.birthDay} LIKE '%February%' THEN 1.0
						WHEN ${prospects.birthDay} LIKE '%Mar%' OR ${prospects.birthDay} LIKE '%March%' THEN 2.0
						WHEN ${prospects.birthDay} LIKE '%Apr%' OR ${prospects.birthDay} LIKE '%April%' THEN 3.0
						WHEN ${prospects.birthDay} LIKE '%May%' THEN 4.0
						WHEN ${prospects.birthDay} LIKE '%Jun%' OR ${prospects.birthDay} LIKE '%June%' THEN 5.0
						WHEN ${prospects.birthDay} LIKE '%Jul%' OR ${prospects.birthDay} LIKE '%July%' THEN 6.0
						WHEN ${prospects.birthDay} LIKE '%Aug%' OR ${prospects.birthDay} LIKE '%August%' THEN 7.0
						WHEN ${prospects.birthDay} LIKE '%Sep%' OR ${prospects.birthDay} LIKE '%September%' THEN 8.0
						WHEN ${prospects.birthDay} LIKE '%Oct%' OR ${prospects.birthDay} LIKE '%October%' THEN 9.0
						WHEN ${prospects.birthDay} LIKE '%Nov%' OR ${prospects.birthDay} LIKE '%November%' THEN 10.0
						WHEN ${prospects.birthDay} LIKE '%Dec%' OR ${prospects.birthDay} LIKE '%December%' THEN 11.0
						ELSE 0.0
					END) / 12.0 +
					(CAST(substr(${prospects.birthDay}, 
						CASE 
							WHEN ${prospects.birthDay} LIKE '% [0-9], %' THEN instr(${prospects.birthDay}, ' ') + 1
							WHEN ${prospects.birthDay} LIKE '% [0-9][0-9], %' THEN instr(${prospects.birthDay}, ' ') + 1
							ELSE 1
						END,
						CASE 
							WHEN ${prospects.birthDay} LIKE '% [0-9], %' THEN 1
							WHEN ${prospects.birthDay} LIKE '% [0-9][0-9], %' THEN 2
							ELSE 2
						END
					) AS REAL) - 1.0) / 365.25
				)
			`;
			
			orderByClause = sortOrder === 'asc' ? asc(ageCalculation) : desc(ageCalculation);
		} else {
			// Default to rank ascending
			orderByClause = asc(sql`CAST(${prospects.rank} AS INTEGER)`);
		}

		// Get total count for pagination
		const totalCountQuery = await db
			.select({ count: sql<number>`count(*)` })
			.from(prospects)
			.where(and(...whereConditions));

		const totalCount = totalCountQuery[0]?.count || 0;

		// Get prospects with pagination
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
			.where(and(...whereConditions))
			.orderBy(orderByClause)
			.limit(limit)
			.offset(offset);

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

		// Calculate pagination info
		const totalPages = Math.ceil(totalCount / limit);
		const hasNextPage = page < totalPages;
		const hasPrevPage = page > 1;

		const response = {
			prospects: transformedProspects,
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
				limit,
				hasNextPage,
				hasPrevPage
			}
		};

		// Cache the response if appropriate
		if (shouldCache(page, search)) {
			try {
				await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));
			} catch (cacheError) {
				console.warn('Redis cache write error:', cacheError);
				// Don't fail the request if caching fails
			}
		}

		return json(response);

	} catch (error) {
		console.error('Error fetching prospects:', error);
		return json(
			{ error: 'Failed to fetch prospects' },
			{ status: 500 }
		);
	}
}
