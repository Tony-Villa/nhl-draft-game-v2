import { form, query } from '$app/server';
import { error, invalid, redirect } from '@sveltejs/kit';
import {
	editLeagueFormSchema,
	joinLeagueFormSchema,
	leagueStandingsQuerySchema,
	leaveLeagueFormSchema
} from './leagues.schemas';
import { leaguesAndBoardsEnabled } from '$lib/server/feature-flags';
import { requireRemoteUser } from '$lib/server/remote/request';
import {
	editLeague,
	getLeagueForMember,
	getLeagueLeaderboard,
	joinLeague,
	LeagueMutationError,
	leaveLeague
} from '$lib/server/services/league-service';

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

export const joinLeagueForm = form(joinLeagueFormSchema, async ({ inviteCode }) => {
	if (!leaguesAndBoardsEnabled()) {
		throw error(404, 'Leagues are unavailable');
	}

	const user = requireRemoteUser();
	let league;

	try {
		league = await joinLeague({
			userId: user.id,
			inviteCode
		});
	} catch (cause) {
		if (cause instanceof LeagueMutationError) {
			invalid(cause.message);
		}

		console.error('Remote league join failed:', cause);
		throw error(500, 'Failed to join league');
	}

	redirect(303, `/draft-center/leagues/${league.slug}`);
});

export const leaveLeagueForm = form(leaveLeagueFormSchema, async ({ slug }) => {
	if (!leaguesAndBoardsEnabled()) {
		throw error(404, 'Leagues are unavailable');
	}

	const user = requireRemoteUser();

	try {
		await leaveLeague({
			userId: user.id,
			slug
		});
	} catch (cause) {
		if (cause instanceof LeagueMutationError) {
			invalid(cause.message);
		}

		console.error('Remote league leave failed:', cause);
		throw error(500, 'Failed to leave league');
	}

	redirect(303, '/draft-center/leagues');
});

export const editLeagueForm = form(
	editLeagueFormSchema,
	async ({ slug, name, description }, issue) => {
		if (!leaguesAndBoardsEnabled()) {
			throw error(404, 'Leagues are unavailable');
		}

		const user = requireRemoteUser();

		try {
			return await editLeague({
				userId: user.id,
				slug,
				name,
				description
			});
		} catch (cause) {
			if (cause instanceof LeagueMutationError) {
				if (cause.code === 'invalid_details') {
					invalid(issue.name(cause.message));
				}

				invalid(cause.message);
			}

			console.error('Remote league edit failed:', cause);
			throw error(500, 'Failed to update league details');
		}
	}
);
