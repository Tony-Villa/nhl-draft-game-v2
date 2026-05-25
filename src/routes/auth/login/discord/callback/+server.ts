import type { RequestEvent } from '@sveltejs/kit';
import { handleBetterAuthSocialCallback } from '$lib/server/socialSignIn';

export async function GET(event: RequestEvent): Promise<Response> {
	return handleBetterAuthSocialCallback(event, 'discord');
}
