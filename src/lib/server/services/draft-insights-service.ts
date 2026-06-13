import { db } from '$lib/server/db/index.js';
import { draftBoardPicks, draftBoards, prospects } from '$lib/server/db/schema';
import { redis } from '$lib/server/redis.js';
import type { DraftInsightsQuery } from '$lib/remote/draft-insights.schemas';
import type { DraftInsightsData, DraftInsightProspect } from '$lib/types.js';
import { and, count, desc, eq, max, min, sql } from 'drizzle-orm';

const CACHE_PREFIX = 'draft-insights:';
const CACHE_TTL = 300;

export function getDraftInsightsCacheKey(input: DraftInsightsQuery): string {
	return `${CACHE_PREFIX}${input.gameId}:${input.position}`;
}

export async function getDraftInsights(input: DraftInsightsQuery): Promise<DraftInsightsData> {
	const cacheKey = getDraftInsightsCacheKey(input);

	try {
		const cachedResult = await redis.get(cacheKey);
		if (cachedResult) {
			return JSON.parse(cachedResult) as DraftInsightsData;
		}
	} catch (cacheError) {
		console.warn('Redis cache read error:', cacheError);
	}

	const data = await queryDraftInsights(input);

	try {
		await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
	} catch (cacheError) {
		console.warn('Redis cache write error:', cacheError);
	}

	return data;
}

async function queryDraftInsights(input: DraftInsightsQuery): Promise<DraftInsightsData> {
	const { gameId, position } = input;
	const topProspectsAtPosition = await db
		.select({
			prospectId: draftBoardPicks.prospectId,
			name: prospects.name,
			position: prospects.position,
			team: prospects.team,
			targetPositionCount: count(draftBoardPicks.id).as('target_position_count'),
			percentage: sql<number>`ROUND(COUNT(${draftBoardPicks.id}) * 100.0 / (
				SELECT COUNT(*) FROM ${draftBoardPicks}
				INNER JOIN ${draftBoards} ON ${draftBoardPicks.draftBoardId} = ${draftBoards.id}
				WHERE ${draftBoards.gameId} = ${gameId}
					AND ${draftBoards.status} = 'submitted'
					AND ${draftBoardPicks.positionDrafted} = ${position}
			), 1)`.as('percentage')
		})
		.from(draftBoardPicks)
		.innerJoin(draftBoards, eq(draftBoardPicks.draftBoardId, draftBoards.id))
		.innerJoin(prospects, eq(draftBoardPicks.prospectId, prospects.id))
		.where(
			and(
				eq(draftBoards.gameId, gameId),
				eq(draftBoards.status, 'submitted'),
				eq(draftBoardPicks.positionDrafted, position)
			)
		)
		.groupBy(draftBoardPicks.prospectId, prospects.name, prospects.position, prospects.team)
		.orderBy(desc(count(draftBoardPicks.id)))
		.limit(3);

	if (topProspectsAtPosition.length === 0) {
		return {
			targetPosition: position,
			gameId,
			prospects: []
		};
	}

	const topProspectIds = topProspectsAtPosition
		.map((prospect) => prospect.prospectId)
		.filter((id): id is string => Boolean(id));
	const windowMinPosition = Math.max(1, position - 3);
	const windowMaxPosition = Math.min(32, position + 3);
	const prospectIdCondition = sql`${draftBoardPicks.prospectId} IN (${sql.join(
		topProspectIds.map((id) => sql`${id}`),
		sql`, `
	)})`;

	const windowPositionDistribution = await db
		.select({
			prospectId: draftBoardPicks.prospectId,
			positionDrafted: draftBoardPicks.positionDrafted,
			countAtPosition: count(draftBoardPicks.id).as('count_at_position')
		})
		.from(draftBoardPicks)
		.innerJoin(draftBoards, eq(draftBoardPicks.draftBoardId, draftBoards.id))
		.where(
			and(
				eq(draftBoards.gameId, gameId),
				eq(draftBoards.status, 'submitted'),
				prospectIdCondition,
				sql`${draftBoardPicks.positionDrafted} >= ${windowMinPosition}`,
				sql`${draftBoardPicks.positionDrafted} <= ${windowMaxPosition}`
			)
		)
		.groupBy(draftBoardPicks.prospectId, draftBoardPicks.positionDrafted)
		.orderBy(draftBoardPicks.prospectId, draftBoardPicks.positionDrafted);

	const allPositionDistribution = await db
		.select({
			prospectId: draftBoardPicks.prospectId,
			positionDrafted: draftBoardPicks.positionDrafted,
			countAtPosition: count(draftBoardPicks.id).as('count_at_position')
		})
		.from(draftBoardPicks)
		.innerJoin(draftBoards, eq(draftBoardPicks.draftBoardId, draftBoards.id))
		.where(
			and(eq(draftBoards.gameId, gameId), eq(draftBoards.status, 'submitted'), prospectIdCondition)
		)
		.groupBy(draftBoardPicks.prospectId, draftBoardPicks.positionDrafted)
		.orderBy(draftBoardPicks.prospectId, draftBoardPicks.positionDrafted);

	const prospectStats = await db
		.select({
			prospectId: draftBoardPicks.prospectId,
			avgPosition: sql<number>`ROUND(AVG(CAST(${draftBoardPicks.positionDrafted} AS FLOAT)), 1)`.as(
				'avg_position'
			),
			minPosition: min(draftBoardPicks.positionDrafted).as('min_position'),
			maxPosition: max(draftBoardPicks.positionDrafted).as('max_position')
		})
		.from(draftBoardPicks)
		.innerJoin(draftBoards, eq(draftBoardPicks.draftBoardId, draftBoards.id))
		.where(
			and(eq(draftBoards.gameId, gameId), eq(draftBoards.status, 'submitted'), prospectIdCondition)
		)
		.groupBy(draftBoardPicks.prospectId);

	const processedData: DraftInsightProspect[] = topProspectsAtPosition.map((prospect) => {
		const stats = prospectStats.find((stat) => stat.prospectId === prospect.prospectId);
		const windowPositions = windowPositionDistribution.filter(
			(item) => item.prospectId === prospect.prospectId
		);
		const heatmapData: Record<number, number> = {};

		for (let pick = windowMinPosition; pick <= windowMaxPosition; pick++) {
			heatmapData[pick] = 0;
		}

		for (const item of windowPositions) {
			heatmapData[item.positionDrafted] = item.countAtPosition;
		}

		const allPositions = allPositionDistribution.filter(
			(item) => item.prospectId === prospect.prospectId
		);
		const mostCommonPosition =
			allPositions.length > 0
				? allPositions.reduce((previous, current) =>
						current.countAtPosition > previous.countAtPosition ? current : previous
					).positionDrafted
				: position;
		const range = (stats?.maxPosition ?? 0) - (stats?.minPosition ?? 0);
		let consistency: DraftInsightProspect['consistency'] = 'HIGH';

		if (range > 10) consistency = 'LOW';
		else if (range > 7) consistency = 'MEDIUM';

		return {
			prospectId: prospect.prospectId ?? '',
			name: prospect.name,
			position: prospect.position ?? '',
			team: prospect.team,
			percentage: prospect.percentage,
			targetPositionCount: prospect.targetPositionCount,
			avgPosition: stats?.avgPosition ?? 0,
			draftRange: `${stats?.minPosition ?? 0}-${stats?.maxPosition ?? 0}`,
			mostCommonPosition,
			consistency,
			heatmapData
		};
	});

	return {
		targetPosition: position,
		gameId,
		prospects: processedData
	};
}
