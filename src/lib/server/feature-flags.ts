import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';

export function featureFlagEnabled(value: string | undefined) {
	return ['1', 'true', 'yes', 'on'].includes(value?.trim().toLowerCase() || '');
}

export function leaguesAndBoardsEnabled() {
	return featureFlagEnabled(env.FF_LEAGUES_AND_BOARDS);
}

export function requireLeaguesAndBoards() {
	if (!leaguesAndBoardsEnabled()) {
		throw redirect(303, '/draft-center');
	}
}
