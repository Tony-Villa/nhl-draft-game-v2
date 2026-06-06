import { fail, redirect, type Actions } from '@sveltejs/kit';
import { CURRENT_GAME } from '$env/static/private';
import type { PageServerLoad } from './$types';
import {
	getLeagueForMember,
	getLeagueLeaderboard,
	requireLeagueMember,
	setLeagueMemberBoard
} from '$lib/server/services/league-service.js';
import { getUserDraftBoards } from '$lib/server/services/draft-board-service.js';
import { requireLeaguesAndBoards } from '$lib/server/feature-flags.js';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	requireLeaguesAndBoards();

	if (!locals.user) {
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	const slug = params.slug;
	if (!slug) {
		throw redirect(303, '/draft-center/leagues');
	}

	const league = requireLeagueMember(await getLeagueForMember(slug, locals.user.id));
	const leaderboard = await getLeagueLeaderboard(league.id, league.gameId);
	const boards = await getUserDraftBoards(locals.user.id, league.gameId);

	return {
		isLoggedIn: true,
		league,
		leaderboard,
		boards
	};
};

export const actions: Actions = {
	setBoard: async ({ request, locals, params }) => {
		requireLeaguesAndBoards();

		if (!locals.user) {
			throw redirect(303, '/auth/login');
		}

		const slug = params.slug;
		if (!slug) {
			throw redirect(303, '/draft-center/leagues');
		}

		const league = requireLeagueMember(await getLeagueForMember(slug, locals.user.id));
		const formData = await request.formData();
		const draftBoardId = Number(formData.get('draftBoardId'));

		try {
			await setLeagueMemberBoard({
				leagueId: league.id,
				userId: locals.user.id,
				gameId: league.gameId || CURRENT_GAME,
				draftBoardId
			});
		} catch (error) {
			return fail(400, {
				setBoardError: error instanceof Error ? error.message : 'Failed to update league board.'
			});
		}

		return {
			success: true
		};
	}
};
