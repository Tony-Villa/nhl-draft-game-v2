import type { RequestEvent } from "./$types";
import { leaguesAndBoardsEnabled } from '$lib/server/feature-flags.js';

export const load = async ({locals}: RequestEvent) => {
	return {
		user: locals,
		isAuthenticated: locals.session !== null,
		leaguesAndBoardsEnabled: leaguesAndBoardsEnabled()
	}
}
