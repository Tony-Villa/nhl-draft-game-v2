import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { drafts } from '$lib/server/db/schema/drafts';
import { prospects } from '$lib/server/db/schema/prospects';
import { eq, and, sql, count, avg, min, max, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { redis } from '$lib/server/redis';

// Cache configuration
const CACHE_PREFIX = 'draft-insights:';
const CACHE_TTL = 300; // 5 minutes

export const GET: RequestHandler = async ({ url }) => {
  const gameId = url.searchParams.get('gameId') || '2';
  const position = parseInt(url.searchParams.get('position') || '7');

  // Generate cache key
  const cacheKey = `${CACHE_PREFIX}${gameId}:${position}`;

  try {
    // Try to get from cache first
    try {
      const cachedResult = await redis.get(cacheKey);
      if (cachedResult) {
        return json(JSON.parse(cachedResult));
      }
    } catch (cacheError) {
      console.warn('Redis cache read error:', cacheError);
      // Continue with database query if cache fails
    }
    // Get top 3 prospects drafted most at this position
    const topProspectsAtPosition = await db
      .select({
        prospectId: drafts.prospectId,
        name: prospects.name,
        position: prospects.position,
        team: prospects.team,
        targetPositionCount: count(drafts.id).as('target_position_count'),
        percentage: sql<number>`ROUND(COUNT(${drafts.id}) * 100.0 / (
          SELECT COUNT(*) FROM ${drafts} 
          WHERE ${drafts.gameId} = ${gameId} AND ${drafts.positionDrafted} = ${position}
        ), 1)`.as('percentage')
      })
      .from(drafts)
      .innerJoin(prospects, eq(drafts.prospectId, prospects.id))
      .where(and(
        eq(drafts.gameId, gameId),
        eq(drafts.positionDrafted, position)
      ))
      .groupBy(drafts.prospectId, prospects.name, prospects.position, prospects.team)
      .orderBy(desc(count(drafts.id)))
      .limit(3);

    if (topProspectsAtPosition.length === 0) {
      return json({
        success: true,
        data: {
          targetPosition: position,
          gameId,
          prospects: []
        }
      });
    }

    const topProspectIds = topProspectsAtPosition.map(p => p.prospectId).filter(Boolean);

    // Get position distribution for these prospects
    const positionDistribution = await db
      .select({
        prospectId: drafts.prospectId,
        positionDrafted: drafts.positionDrafted,
        countAtPosition: count(drafts.id).as('count_at_position')
      })
      .from(drafts)
      .where(and(
        eq(drafts.gameId, gameId),
        sql`${drafts.prospectId} IN (${sql.join(topProspectIds.map(id => sql`${id}`), sql`, `)})`
      ))
      .groupBy(drafts.prospectId, drafts.positionDrafted)
      .orderBy(drafts.prospectId, drafts.positionDrafted);

    // Get prospect stats (avg, min, max positions)
    const prospectStats = await db
      .select({
        prospectId: drafts.prospectId,
        avgPosition: sql<number>`ROUND(AVG(CAST(${drafts.positionDrafted} AS FLOAT)), 1)`.as('avg_position'),
        minPosition: min(drafts.positionDrafted).as('min_position'),
        maxPosition: max(drafts.positionDrafted).as('max_position')
      })
      .from(drafts)
      .where(and(
        eq(drafts.gameId, gameId),
        sql`${drafts.prospectId} IN (${sql.join(topProspectIds.map(id => sql`${id}`), sql`, `)})`
      ))
      .groupBy(drafts.prospectId);

    // Process the data to create the final response
    const processedData = topProspectsAtPosition.map(prospect => {
      const stats = prospectStats.find(s => s.prospectId === prospect.prospectId);
      const positions = positionDistribution.filter(p => p.prospectId === prospect.prospectId);
      
      // Create position heatmap data
      const heatmapData: Record<number, number> = {};
      positions.forEach(pos => {
        heatmapData[pos.positionDrafted] = pos.countAtPosition;
      });

      // Find most common position
      const mostCommonPosition = positions.reduce((prev, current) => 
        current.countAtPosition > prev.countAtPosition ? current : prev
      );

      // Calculate consistency (simple version based on range)
      const range = (stats?.maxPosition || 0) - (stats?.minPosition || 0);
      let consistency: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
      if (range > 4) consistency = 'LOW';
      else if (range > 2) consistency = 'MEDIUM';

      return {
        name: prospect.name,
        position: prospect.position,
        team: prospect.team,
        percentage: prospect.percentage,
        targetPositionCount: prospect.targetPositionCount,
        avgPosition: stats?.avgPosition || 0,
        draftRange: `${stats?.minPosition || 0}-${stats?.maxPosition || 0}`,
        mostCommonPosition: mostCommonPosition?.positionDrafted || position,
        consistency,
        heatmapData
      };
    });

    const response = {
      success: true,
      data: {
        targetPosition: position,
        gameId,
        prospects: processedData
      }
    };

    // Cache the response
    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));
    } catch (cacheError) {
      console.warn('Redis cache write error:', cacheError);
      // Don't fail the request if caching fails
    }

    return json(response);

  } catch (error) {
    console.error('Error fetching draft insights:', error);
    return json({
      success: false,
      error: 'Failed to fetch draft insights'
    }, { status: 500 });
  }
};
