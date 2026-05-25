import type { RequestEvent } from '@sveltejs/kit';
import { auth } from './auth';

type SocialProvider = 'discord' | 'google';

export const handleBetterAuthSocialCallback = async (
	event: RequestEvent,
	provider: SocialProvider
) => {
	const url = new URL(`/api/auth/callback/${provider}`, event.url.origin);
	url.search = event.url.search;

	return auth.handler(
		new Request(url, {
			method: event.request.method,
			headers: event.request.headers
		})
	);
};

export const redirectToSocialProvider = async (
	event: RequestEvent,
	provider: SocialProvider
) => {
	const callbackURL = new URL('/auth/oauth/complete', event.url.origin).toString();
	const errorCallbackURL = new URL('/auth/login', event.url.origin).toString();

	const response = await auth.handler(
		new Request(new URL('/api/auth/sign-in/social', event.url.origin), {
			method: 'POST',
			headers: {
				accept: 'application/json',
				'content-type': 'application/json',
				cookie: event.request.headers.get('cookie') ?? '',
				origin: event.url.origin
			},
			body: JSON.stringify({
				provider,
				callbackURL,
				newUserCallbackURL: callbackURL,
				errorCallbackURL
			})
		})
	);

	const contentType = response.headers.get('content-type');
	const body = contentType?.includes('application/json')
		? ((await response.json()) as { url?: string })
		: { url: undefined };
	const location = response.headers.get('location') ?? body.url;

	if (!location) {
		throw new Error(`Better Auth did not return a ${provider} authorization URL`);
	}

	const headers = new Headers({ location });
	const setCookies =
		(response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ??
		(response.headers.get('set-cookie') ? [response.headers.get('set-cookie') as string] : []);

	for (const cookie of setCookies) {
		headers.append('set-cookie', cookie);
	}

	return new Response(null, {
		status: 302,
		headers
	});
};
