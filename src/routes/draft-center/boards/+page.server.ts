import { fail, redirect, type Actions } from '@sveltejs/kit';
import { CURRENT_GAME } from '$env/static/private';
import { and, eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/index.js';
import { draftBoards } from '$lib/server/db/schema';
import {
	createDraftBoard,
	deleteDraftBoard,
	duplicateDraftBoard,
	ensureGlobalGameEntry,
	getSelectedGlobalDraftBoard,
	getUserDraftBoardById,
	getUserDraftBoards,
	renameDraftBoard
} from '$lib/server/services/draft-board-service.js';
import { requireLeaguesAndBoards } from '$lib/server/feature-flags.js';

export const load: PageServerLoad = async ({ locals }) => {
	requireLeaguesAndBoards();

	if (!locals.user) {
		throw redirect(303, '/auth/login');
	}

	const boards = await getUserDraftBoards(locals.user.id, CURRENT_GAME);
	const selectedGlobalBoard = await getSelectedGlobalDraftBoard(locals.user.id, CURRENT_GAME);

	return {
		isLoggedIn: true,
		boards,
		selectedGlobalBoardId: selectedGlobalBoard?.id || null
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

		if (name.length < 2) {
			return fail(400, {
				createError: 'Board name must be at least 2 characters.',
				name
			});
		}

		let board;

		try {
			board = await createDraftBoard({
				userId: locals.user.id,
				gameId: CURRENT_GAME,
				name
			});
		} catch (error) {
			return fail(400, {
				createError: error instanceof Error ? error.message : 'Failed to create board.',
				name
			});
		}

		throw redirect(303, `/draft-center?board=${board.id}`);
	},
	duplicate: async ({ request, locals }) => {
		requireLeaguesAndBoards();

		if (!locals.user) {
			throw redirect(303, '/auth/login');
		}

		const formData = await request.formData();
		const sourceDraftBoardId = Number(formData.get('sourceDraftBoardId'));
		const name = String(formData.get('name') || 'Copy of My Draft Board').trim();

		let board;

		try {
			board = await duplicateDraftBoard({
				userId: locals.user.id,
				gameId: CURRENT_GAME,
				sourceDraftBoardId,
				name
			});
		} catch (error) {
			return fail(400, {
				duplicateError: error instanceof Error ? error.message : 'Failed to duplicate board.'
			});
		}

		throw redirect(303, `/draft-center?board=${board.id}`);
	},
	rename: async ({ request, locals }) => {
		requireLeaguesAndBoards();

		if (!locals.user) {
			throw redirect(303, '/auth/login');
		}

		const formData = await request.formData();
		const draftBoardId = Number(formData.get('draftBoardId'));
		const name = String(formData.get('name') || '').trim();

		try {
			await renameDraftBoard({
				userId: locals.user.id,
				gameId: CURRENT_GAME,
				draftBoardId,
				name
			});
		} catch (error) {
			return fail(400, {
				renameError: error instanceof Error ? error.message : 'Failed to rename board.',
				renameBoardId: draftBoardId
			});
		}

		return {
			success: true
		};
	},
	delete: async ({ request, locals }) => {
		requireLeaguesAndBoards();

		if (!locals.user) {
			throw redirect(303, '/auth/login');
		}

		const formData = await request.formData();
		const draftBoardId = Number(formData.get('draftBoardId'));

		try {
			await deleteDraftBoard({
				userId: locals.user.id,
				gameId: CURRENT_GAME,
				draftBoardId
			});
		} catch (error) {
			return fail(400, {
				deleteError: error instanceof Error ? error.message : 'Failed to delete board.',
				deleteBoardId: draftBoardId
			});
		}

		return {
			success: true
		};
	},
	setGlobal: async ({ request, locals }) => {
		requireLeaguesAndBoards();

		if (!locals.user) {
			throw redirect(303, '/auth/login');
		}

		const formData = await request.formData();
		const draftBoardId = Number(formData.get('draftBoardId'));
		const board = await getUserDraftBoardById(locals.user.id, CURRENT_GAME, draftBoardId);

		if (!board) {
			return fail(404, {
				setGlobalError: 'Draft board not found.'
			});
		}

		if (board.status !== 'submitted') {
			return fail(400, {
				setGlobalError: 'Submit this board before using it globally.'
			});
		}

		await db
			.update(draftBoards)
			.set({
				isDefault: false,
				updatedAt: sql`(cast (unixepoch() as int))`
			})
			.where(and(eq(draftBoards.userId, locals.user.id), eq(draftBoards.gameId, CURRENT_GAME)));

		await db
			.update(draftBoards)
			.set({
				isDefault: true,
				updatedAt: sql`(cast (unixepoch() as int))`
			})
			.where(eq(draftBoards.id, board.id));

		await ensureGlobalGameEntry(locals.user.id, CURRENT_GAME, board.id);

		return {
			success: true
		};
	}
};
