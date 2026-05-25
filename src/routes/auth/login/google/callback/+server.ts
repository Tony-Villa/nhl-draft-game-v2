import type { RequestEvent } from '@sveltejs/kit';
import { handleBetterAuthSocialCallback } from '$lib/server/socialSignIn';

export const GET = async (event: RequestEvent) => {
	return handleBetterAuthSocialCallback(event, 'google');
};
