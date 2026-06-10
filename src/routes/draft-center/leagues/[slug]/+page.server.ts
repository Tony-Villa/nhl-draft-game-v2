import { fail, redirect, type Actions } from '@sveltejs/kit';
import { CURRENT_GAME } from '$env/static/private';
import type { PageServerLoad } from './$types';
import {
	editLeague,
	getLeagueForMember,
	leaveLeague,
	requireLeagueMember,
	setLeagueMemberBoard
} from '$lib/server/services/league-service.js';
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

	return {
		isLoggedIn: true,
		league
	};
};

export const actions: Actions = {
	edit: async ({ request, locals, params }) => {
		requireLeaguesAndBoards();

		if (!locals.user) {
			throw redirect(303, '/auth/login');
		}

		const slug = params.slug;
		if (!slug) {
			throw redirect(303, '/draft-center/leagues');
		}

		const formData = await request.formData();
		const name = String(formData.get('name') || '').trim();
		const description = String(formData.get('description') || '').trim();

		try {
			await editLeague({
				userId: locals.user.id,
				slug,
				name,
				description
			});
		} catch (error) {
			return fail(400, {
				editError: error instanceof Error ? error.message : 'Failed to update league details.',
				name,
				description
			});
		}

		return {
			success: true
		};
	},
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
	},
	leave: async ({ locals, params }) => {
		requireLeaguesAndBoards();

		if (!locals.user) {
			throw redirect(303, '/auth/login');
		}

		const slug = params.slug;
		if (!slug) {
			throw redirect(303, '/draft-center/leagues');
		}

		try {
			await leaveLeague({
				userId: locals.user.id,
				slug
			});
		} catch (error) {
			return fail(400, {
				leaveError: error instanceof Error ? error.message : 'Failed to leave league.'
			});
		}

		throw redirect(303, '/draft-center/leagues');
	}
};
