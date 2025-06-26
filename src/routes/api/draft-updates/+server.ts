import { db } from '$lib/server/db/index.js'
import { nhlDraft, games, prospects } from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'

export async function GET({url}) {
  const gameId = url.searchParams.get('game')
  const since = url.searchParams.get('since') // timestamp of last update
  
  try {
    // Get current game state
    const [gameInfo] = await db.select({
      gamePhase: games.gamePhase
    }).from(games).where(eq(games.id, gameId!))

    // Get all picks made with prospect details
    const nhlPicks = await db.select({
      positionDrafted: nhlDraft.positionDrafted,
      prospectId: nhlDraft.prospectId,
      prospectName: nhlDraft.prospectName,
      team: nhlDraft.team,
      createdAt: nhlDraft.createdAt,
      // Get full prospect details for richer data
      prospectRank: prospects.rank,
      prospectPosition: prospects.position,
      prospectTeam: prospects.team,
      prospectNation: prospects.nation
    })
    .from(nhlDraft)
    .leftJoin(prospects, eq(nhlDraft.prospectId, prospects.id))
    .where(eq(nhlDraft.gameId, +gameId!))

    const response = {
      gamePhase: gameInfo?.gamePhase,
      totalPicks: nhlPicks.length,
      picks: nhlPicks.map(pick => ({
        draftPosition: pick.positionDrafted,
        prospect: { 
          id: pick.prospectId,
          name: pick.prospectName,
          rank: pick.prospectRank,
          position: pick.prospectPosition,
          team: pick.prospectTeam,
          nation: pick.prospectNation
        },
        team: pick.team
      })),
      lastUpdated: new Date().toISOString()
    }

    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        // Add cache headers for efficiency
        "Cache-Control": "no-cache, must-revalidate"
      }
    })
  } catch (error) {
    console.error("Error getting draft updates:", error)
    return new Response(JSON.stringify({ error: "Failed to get updates" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
