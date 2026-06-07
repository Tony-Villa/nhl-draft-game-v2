import { CURRENT_GAME } from '$env/static/private';
import { liveLeaderboardQuerySchema } from '$lib/remote/leaderboard.schemas';
import { getLiveLeaderboard } from '$lib/server/services/leaderboard-service';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const parsedQuery = liveLeaderboardQuerySchema.safeParse({
		gameId: url.searchParams.get('gameId') || CURRENT_GAME,
		limit: url.searchParams.get('limit') || '10'
	});

	if (!parsedQuery.success) {
		return json({ error: 'Invalid leaderboard query' }, { status: 400 });
	}

	try {
		const data = await getLiveLeaderboard(parsedQuery.data);

		return json(
			{
				success: true,
				...data
			},
			{
				headers: {
					'Cache-Control': 'no-cache, must-revalidate'
				}
			}
		);
	} catch (error) {
		console.error('Error fetching leaderboard:', error);
		return json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
	}
};
