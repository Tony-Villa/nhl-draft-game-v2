import { fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createLeague, getUserLeagues, joinLeague } from '$lib/server/services/league-service.js';
import { requireLeaguesAndBoards } from '$lib/server/feature-flags.js';

export const load: PageServerLoad = async ({ locals, url }) => {
	requireLeaguesAndBoards();

	if (!locals.user) {
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent('/draft-center/leagues')}`);
	}

	return {
		isLoggedIn: true,
		leagues: await getUserLeagues(locals.user.id),
		inviteCode: url.searchParams.get('invite') || ''
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		requireLeaguesAndBoards();

		if (!locals.user) {
			throw redirect(303, '/auth/login');
		}

		const formData = await request.formData();
		const name = String(formData.get('name') || '').trim();
		const description = String(formData.get('description') || '').trim();

		if (name.length < 3) {
			return fail(400, {
				createError: 'League name must be at least 3 characters.',
				name,
				description
			});
		}

		let league;

		try {
			league = await createLeague({
				userId: locals.user.id,
				name,
				description
			});
		} catch (error) {
			return fail(400, {
				createError: error instanceof Error ? error.message : 'Failed to create league.',
				name,
				description
			});
		}

		throw redirect(303, `/draft-center/leagues/${league.slug}`);
	},
	join: async ({ request, locals }) => {
		requireLeaguesAndBoards();

		if (!locals.user) {
			throw redirect(303, '/auth/login');
		}

		const formData = await request.formData();
		const inviteCode = String(formData.get('inviteCode') || '').trim();

		if (!inviteCode) {
			return fail(400, {
				joinError: 'Enter an invite code.',
				inviteCode
			});
		}

		let league;

		try {
			league = await joinLeague({
				userId: locals.user.id,
				inviteCode
			});
		} catch (error) {
			return fail(400, {
				joinError: error instanceof Error ? error.message : 'Failed to join league.',
				inviteCode
			});
		}

		throw redirect(303, `/draft-center/leagues/${league.slug}`);
	}
};
