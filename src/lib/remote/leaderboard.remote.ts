import { getLadder, getLiveLeaderboard } from '$lib/server/services/leaderboard-service';
import { query } from '$app/server';
import { error } from '@sveltejs/kit';
import { ladderQuerySchema, liveLeaderboardQuerySchema } from './leaderboard.schemas';

export const getLiveLeaderboardRows = query(liveLeaderboardQuerySchema, async (input) => {
	try {
		return await getLiveLeaderboard(input);
	} catch (cause) {
		console.error('Remote live leaderboard query failed:', cause);
		throw error(500, 'Failed to load leaderboard');
	}
});

export const getLadderRows = query(ladderQuerySchema, async (input) => {
	try {
		return await getLadder(input);
	} catch (cause) {
		console.error('Remote ladder query failed:', cause);
		throw error(500, 'Failed to load final standings');
	}
});
