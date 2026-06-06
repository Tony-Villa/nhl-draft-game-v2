import { CURRENT_GAME } from '$env/static/private'
import { scoreSubmittedDraftBoards } from '$lib/server/services/scoring-service.js'

export async function GET() {
  try {
    const scoreResults = await scoreSubmittedDraftBoards(CURRENT_GAME)

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
