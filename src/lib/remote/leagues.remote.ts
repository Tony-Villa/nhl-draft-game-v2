import { query } from '$app/server';
import { error } from '@sveltejs/kit';
import { leagueStandingsQuerySchema } from './leagues.schemas';
import { leaguesAndBoardsEnabled } from '$lib/server/feature-flags';
import { requireRemoteUser } from '$lib/server/remote/request';
import { getLeagueForMember, getLeagueLeaderboard } from '$lib/server/services/league-service';

export const getLeagueStandings = query(leagueStandingsQuerySchema, async ({ slug }) => {
	if (!leaguesAndBoardsEnabled()) {
		throw error(404, 'League standings are unavailable');
	}

	const user = requireRemoteUser();
	let league;

	try {
		league = await getLeagueForMember(slug, user.id);
	} catch (cause) {
		console.error('Remote league membership query failed:', cause);
		throw error(500, 'Failed to load league standings');
	}

	if (!league) {
		throw error(404, 'League not found');
	}

	try {
		return await getLeagueLeaderboard(league.id, league.gameId);
	} catch (cause) {
		console.error('Remote league standings query failed:', cause);
		throw error(500, 'Failed to load league standings');
	}
});
