import { redirect } from '@sveltejs/kit';
import { generateState } from 'arctic';
import { discord } from '$lib/server/auth';
import { DISCORD_OAUTH_STATE_COOKIE_NAME } from '$lib/server/authUtils';

import type { RequestEvent } from '@sveltejs/kit';

export async function GET(event: RequestEvent): Promise<Response> {
	const state = generateState();
	const url = await discord.createAuthorizationURL(state, null, ['email', 'identify']);

	event.cookies.set(DISCORD_OAUTH_STATE_COOKIE_NAME, state, {
		path: '/',
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax'
	});

	redirect(302, url.toString());
}
