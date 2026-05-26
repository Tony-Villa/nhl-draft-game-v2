import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { draftBoardPicks, draftBoards } from '$lib/server/db/schema';
import { prospects } from '$lib/server/db/schema/prospects';
import { eq, and, sql, count, avg, min, max, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { redis } from '$lib/server/redis';

// Cache configuration
const CACHE_PREFIX = 'draft-insights:';
const CACHE_TTL = 300; // 5 minutes

export const GET: RequestHandler = async ({ url, locals }) => {
  const gameId = url.searchParams.get('gameId') || '2';
  const position = parseInt(url.searchParams.get('position') || '7');
  const requestedUserId = url.searchParams.get('userId'); // Optional - for checking user's drafts

  // Security: Validate that the requested userId matches the authenticated user
  let userId: string | null = null;
  if (requestedUserId) {
    if (!locals.user?.id) {
      return json({
        success: false,
        error: 'Authentication required to access user-specific data'
      }, { status: 401 });
    }
    
    if (requestedUserId !== locals.user.id) {
      return json({
        success: false,
        error: 'Unauthorized: Cannot access another user\'s draft data'
      }, { status: 403 });
    }
    
    userId = requestedUserId;
  }

  // Generate cache key WITHOUT userId - core data is the same for all users
  const cacheKey = `${CACHE_PREFIX}${gameId}:${position}`;

  try {
    let coreData: any = null;
    
    // Try to get core data from cache first
    try {
      const cachedResult = await redis.get(cacheKey);
      if (cachedResult) {
        coreData = JSON.parse(cachedResult);
      }
    } catch (cacheError) {
      console.warn('Redis cache read error:', cacheError);
      // Continue with database query if cache fails
    }

    if (!coreData) {
      // Get top 3 prospects drafted most at this position
      const topProspectsAtPosition = await db
        .select({
          prospectId: draftBoardPicks.prospectId,
          name: prospects.name,
          position: prospects.position,
          team: prospects.team,
          league: prospects.league,
          rank: prospects.rank,
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
        .where(and(
          eq(draftBoards.gameId, gameId),
          eq(draftBoards.status, 'submitted'),
          eq(draftBoardPicks.positionDrafted, position)
        ))
        .groupBy(draftBoardPicks.prospectId, prospects.name, prospects.position, prospects.team, prospects.league, prospects.rank)
        .orderBy(desc(count(draftBoardPicks.id)))
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

      // Create a 7-position window centered around the target position
      // 3 positions before, target position, 3 positions after
      const windowMinPosition = Math.max(1, position - 3); // Don't go below pick 1
      const windowMaxPosition = Math.min(32, position + 3); // Assuming 32 picks max (adjust as needed)

      // Get position distribution for these prospects (only within the window for heatmap)
      const windowPositionDistribution = await db
        .select({
          prospectId: draftBoardPicks.prospectId,
          positionDrafted: draftBoardPicks.positionDrafted,
          countAtPosition: count(draftBoardPicks.id).as('count_at_position')
        })
        .from(draftBoardPicks)
        .innerJoin(draftBoards, eq(draftBoardPicks.draftBoardId, draftBoards.id))
        .where(and(
          eq(draftBoards.gameId, gameId),
          eq(draftBoards.status, 'submitted'),
          sql`${draftBoardPicks.prospectId} IN (${sql.join(topProspectIds.map(id => sql`${id}`), sql`, `)})`,
          sql`${draftBoardPicks.positionDrafted} >= ${windowMinPosition}`,
          sql`${draftBoardPicks.positionDrafted} <= ${windowMaxPosition}`
        ))
        .groupBy(draftBoardPicks.prospectId, draftBoardPicks.positionDrafted)
        .orderBy(draftBoardPicks.prospectId, draftBoardPicks.positionDrafted);

      // Get all position distribution for these prospects (for most common position calculation)
      const allPositionDistribution = await db
        .select({
          prospectId: draftBoardPicks.prospectId,
          positionDrafted: draftBoardPicks.positionDrafted,
          countAtPosition: count(draftBoardPicks.id).as('count_at_position')
        })
        .from(draftBoardPicks)
        .innerJoin(draftBoards, eq(draftBoardPicks.draftBoardId, draftBoards.id))
        .where(and(
          eq(draftBoards.gameId, gameId),
          eq(draftBoards.status, 'submitted'),
          sql`${draftBoardPicks.prospectId} IN (${sql.join(topProspectIds.map(id => sql`${id}`), sql`, `)})`
        ))
        .groupBy(draftBoardPicks.prospectId, draftBoardPicks.positionDrafted)
        .orderBy(draftBoardPicks.prospectId, draftBoardPicks.positionDrafted);

      // Get prospect stats (avg, min, max positions)
      const prospectStats = await db
        .select({
          prospectId: draftBoardPicks.prospectId,
          avgPosition: sql<number>`ROUND(AVG(CAST(${draftBoardPicks.positionDrafted} AS FLOAT)), 1)`.as('avg_position'),
          minPosition: min(draftBoardPicks.positionDrafted).as('min_position'),
          maxPosition: max(draftBoardPicks.positionDrafted).as('max_position')
        })
        .from(draftBoardPicks)
        .innerJoin(draftBoards, eq(draftBoardPicks.draftBoardId, draftBoards.id))
        .where(and(
          eq(draftBoards.gameId, gameId),
          eq(draftBoards.status, 'submitted'),
          sql`${draftBoardPicks.prospectId} IN (${sql.join(topProspectIds.map(id => sql`${id}`), sql`, `)})`
        ))
        .groupBy(draftBoardPicks.prospectId);

      // Process the data to create the core response (without user-specific data)
      const processedData = topProspectsAtPosition.map(prospect => {
        const stats = prospectStats.find(s => s.prospectId === prospect.prospectId);
        const windowPositions = windowPositionDistribution.filter(p => p.prospectId === prospect.prospectId);
        
        // Create normalized position heatmap data for the 7-position window
        const heatmapData: Record<number, number> = {};
        
        // Initialize all positions in the window with 0
        for (let pos = windowMinPosition; pos <= windowMaxPosition; pos++) {
          heatmapData[pos] = 0;
        }
        
        // Fill in actual values (all positions are already within our window due to query filter)
        windowPositions.forEach(pos => {
          heatmapData[pos.positionDrafted] = pos.countAtPosition;
        });

        // Find most common position (from all positions, not just window)
        const allPositions = allPositionDistribution.filter(p => p.prospectId === prospect.prospectId);
        const mostCommonPosition = allPositions.length > 0 
          ? allPositions.reduce((prev, current) => 
              current.countAtPosition > prev.countAtPosition ? current : prev
            )
          : { positionDrafted: position };

        // Calculate consistency (simple version based on range)
        const range = (stats?.maxPosition || 0) - (stats?.minPosition || 0);
        let consistency: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
        if (range > 10) consistency = 'LOW';
        else if (range > 7) consistency = 'MEDIUM';

        return {
          prospectId: prospect.prospectId || '',
          name: prospect.name,
          position: prospect.position,
          team: prospect.team,
          percentage: prospect.percentage,
          targetPositionCount: prospect.targetPositionCount,
          avgPosition: stats?.avgPosition || 0,
          draftRange: `${stats?.minPosition || 0}-${stats?.maxPosition || 0}`,
          mostCommonPosition: mostCommonPosition.positionDrafted,
          consistency,
          heatmapData
        };
      });

      coreData = {
        success: true,
        data: {
          targetPosition: position,
          gameId,
          prospects: processedData
        }
      };

      // Cache the core response (without user-specific data)
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(coreData));
      } catch (cacheError) {
        console.warn('Redis cache write error:', cacheError);
        // Don't fail the request if caching fails
      }
    }

    // Now add user-specific data if userId is provided
    if (userId && coreData.data?.prospects?.length > 0) {
      const topProspectIds = coreData.data.prospects.map((p: any) => p.prospectId).filter(Boolean);
      
      // Check user's drafts
      const userDrafts = await db
        .select({
          prospectId: draftBoardPicks.prospectId,
          positionDrafted: draftBoardPicks.positionDrafted
        })
        .from(draftBoardPicks)
        .innerJoin(draftBoards, eq(draftBoardPicks.draftBoardId, draftBoards.id))
        .where(and(
          eq(draftBoards.gameId, gameId),
          eq(draftBoards.userId, userId),
          sql`${draftBoardPicks.prospectId} IN (${sql.join(topProspectIds.map((id: string) => sql`${id}`), sql`, `)})`
        ));

      // Add user draft status to each prospect
      coreData.data.prospects = coreData.data.prospects.map((prospect: any) => {
        const userDraft = userDrafts.find(ud => ud.prospectId === prospect.prospectId);
        return {
          ...prospect,
          userDraftedAt: userDraft?.positionDrafted
        };
      });
    }

    return json(coreData);

  } catch (error) {
    console.error('Error fetching draft insights:', error);
    return json({
      success: false,
      error: 'Failed to fetch draft insights'
    }, { status: 500 });
  }
};
