import { db } from '$lib/server/db/index.js'
import { drafts, nhlDraft, users, scores, prospects } from '$lib/server/db/schema'
import { eq, and } from 'drizzle-orm'
import { CURRENT_GAME } from '$env/static/private'

export async function GET() {
  try {
    // Get all NHL draft picks for scoring
    const nhlDraftPicks = await db.select({
      prospectId: nhlDraft.prospectId,
      positionDrafted: nhlDraft.positionDrafted
    }).from(nhlDraft).where(eq(nhlDraft.gameId, +CURRENT_GAME))

    // Get all users who have submitted drafts
    const userList = await db.select({
      id: users.id,
      name: users.name,
      avatar: users.avatarUrl
    }).from(users)

    const scoreResults = []

    // Calculate scores for each user
    for (const user of userList) {
      const userDrafts = await db.select({
        prospectId: drafts.prospectId,
        positionDrafted: drafts.positionDrafted
      }).from(drafts)
      .where(and(
        eq(drafts.userId, user.id),
        eq(drafts.gameId, CURRENT_GAME)
      ))

      if (userDrafts.length === 0) continue

      // Calculate points using prospect IDs
      let totalPoints = 0
      const startingPoints = 10

      userDrafts.forEach(userDraft => {
        if (!userDraft.prospectId) {
          return // No points for empty picks
        }

        const nhlPick = nhlDraftPicks.find(pick => pick.prospectId === userDraft.prospectId)
        
        if (nhlPick) {
          // Calculate points: 10 - |user_position - nhl_position|, minimum 0
          const pointDifference = Math.abs(userDraft.positionDrafted - nhlPick.positionDrafted)
          const points = Math.max(0, startingPoints - pointDifference)
          totalPoints += points
        }
        // If prospect wasn't drafted in NHL first round, they get 0 points (already initialized)
      })

      // Update or insert score in database
      await db.insert(scores)
        .values({
          userId: user.id,
          gameId: CURRENT_GAME,
          score: totalPoints
        })
        .onConflictDoUpdate({
          target: [scores.userId, scores.gameId],
          set: { score: totalPoints }
        })

      scoreResults.push({
        userId: user.id,
        userName: user.name,
        avatar: user.avatar,
        score: totalPoints
      })
    }

    // Sort by score descending
    scoreResults.sort((a, b) => b.score - a.score)

    return new Response(JSON.stringify({
      success: true,
      scores: scoreResults,
      totalPlayers: scoreResults.length,
      lastUpdated: new Date().toISOString()
    }), {
      headers: {
        "Content-Type": "application/json"
      }
    })
  } catch (error) {
    console.error("Error calculating scores:", error)
    return new Response(JSON.stringify({ error: "Failed to calculate scores" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}