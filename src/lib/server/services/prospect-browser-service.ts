import { db } from '$lib/server/db/index.js';
import { prospects } from '$lib/server/db/schema';
import { redis } from '$lib/server/redis.js';
import type { ProspectsPage } from '$lib/prospects/types';
import type { ProspectsQuery } from '$lib/remote/prospects.schemas';
import type { Prospect } from '$lib/types.js';
import { and, asc, desc, eq, like, sql } from 'drizzle-orm';

const CACHE_PREFIX = 'prospects:';
const CACHE_TTL = 86400;
const MAX_CACHED_PAGES = 10;

export function getProspectsCacheKey(query: ProspectsQuery): string {
	return `${CACHE_PREFIX}${query.year}:${query.sortBy}:${query.sortOrder}:${query.limit}:${encodeURIComponent(query.search)}:${encodeURIComponent(query.position)}:${query.page}`;
}

export function shouldCacheProspects(query: Pick<ProspectsQuery, 'page' | 'search'>): boolean {
	return !query.search.trim() && query.page <= MAX_CACHED_PAGES;
}

export async function getProspectsPage(query: ProspectsQuery): Promise<ProspectsPage> {
	const cacheKey = getProspectsCacheKey(query);

	if (shouldCacheProspects(query)) {
		try {
			const cachedResult = await redis.get(cacheKey);
			if (cachedResult) {
				return JSON.parse(cachedResult) as ProspectsPage;
			}
		} catch (cacheError) {
			console.warn('Redis cache read error:', cacheError);
		}
	}

	const offset = (query.page - 1) * query.limit;
	const whereConditions = [eq(prospects.draftYear, query.year)];

	if (query.search) {
		whereConditions.push(like(prospects.name, `%${query.search}%`));
	}

	if (query.position) {
		const positions = query.position.split(',').map((position) => position.trim());
		const positionConditions = positions.map((position) => {
			if (position === 'F') {
				return sql`(${prospects.position} LIKE '%C%' OR ${prospects.position} LIKE '%LW%' OR ${prospects.position} LIKE '%RW%' OR ${prospects.position} LIKE '%F%')`;
			}

			return like(prospects.position, `%${position}%`);
		});

		if (positionConditions.length === 1) {
			whereConditions.push(positionConditions[0]);
		} else {
			whereConditions.push(sql`(${sql.join(positionConditions, sql` OR `)})`);
		}
	}

	const orderByClause = getProspectOrderBy(query);

	const totalCountQuery = await db
		.select({ count: sql<number>`count(*)` })
		.from(prospects)
		.where(and(...whereConditions));

	const totalCount = totalCountQuery[0]?.count || 0;
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
			shoots: prospects.shoots
		})
		.from(prospects)
		.where(and(...whereConditions))
		.orderBy(orderByClause)
		.limit(query.limit)
		.offset(offset);

	const transformedProspects: Prospect[] = prospectsData.map((prospect) => ({
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

	const totalPages = Math.ceil(totalCount / query.limit);
	const response: ProspectsPage = {
		prospects: transformedProspects,
		pagination: {
			currentPage: query.page,
			totalPages,
			totalCount,
			limit: query.limit,
			hasNextPage: query.page < totalPages,
			hasPrevPage: query.page > 1
		}
	};

	if (shouldCacheProspects(query)) {
		try {
			await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));
		} catch (cacheError) {
			console.warn('Redis cache write error:', cacheError);
		}
	}

	return response;
}

function getProspectOrderBy(query: ProspectsQuery) {
	if (query.sortBy === 'name') {
		return query.sortOrder === 'asc' ? asc(prospects.name) : desc(prospects.name);
	}

	if (query.sortBy === 'height') {
		return query.sortOrder === 'asc' ? asc(prospects.height) : desc(prospects.height);
	}

	if (query.sortBy === 'age') {
		const currentDate = new Date();
		const currentDecimalYear =
			currentDate.getFullYear() +
			currentDate.getMonth() / 12 +
			(currentDate.getDate() - 1) / 365.25;
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
				(CAST(substr(
					${prospects.birthDay},
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

		return query.sortOrder === 'asc' ? asc(ageCalculation) : desc(ageCalculation);
	}

	const rank = sql`CAST(${prospects.rank} AS INTEGER)`;
	return query.sortOrder === 'asc' ? asc(rank) : desc(rank);
}
