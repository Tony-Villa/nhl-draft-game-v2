import { db } from '$lib/server/db/index.js'
import { scores, users } from '$lib/server/db/schema'
import { eq, desc } from 'drizzle-orm'
import { CURRENT_GAME } from '$env/static/private'

export async function GET({ url }) {
  const limit = url.searchParams.get('limit') || '10'
  
  try {
    // Get top scores with user information
    const topScores = await db.select({
      userId: scores.userId,
      userName: users.name,
      userAvatar: users.avatarUrl,
      score: scores.score
    })
    .from(scores)
    .innerJoin(users, eq(scores.userId, users.id))
    .where(eq(scores.gameId, CURRENT_GAME))
    .orderBy(desc(scores.score))
    .limit(parseInt(limit))

    return new Response(JSON.stringify({
      success: true,
      leaderboard: topScores,
      lastUpdated: new Date().toISOString()
    }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, must-revalidate"
      }
    })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch leaderboard" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
