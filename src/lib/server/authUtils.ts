import type { Cookies } from '@sveltejs/kit';
import { auth } from './auth';

type BetterAuthCookieAttributes =
	Awaited<typeof auth.$context>['authCookies']['sessionToken']['attributes'];

const signCookieValue = async (value: string, secret: string) => {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));

	return `${value}.${Buffer.from(signature).toString('base64')}`;
};

const toSvelteKitCookieOptions = (attributes: BetterAuthCookieAttributes) => {
	const { prefix: _prefix, sameSite, ...cookieOptions } = attributes;

	return {
		...cookieOptions,
		path: attributes.path || '/',
		sameSite:
			typeof sameSite === 'string'
				? (sameSite.toLowerCase() as 'strict' | 'lax' | 'none')
				: sameSite
	};
};

export const createAndSetSession = async (userId: string, cookies: Cookies) => {
	const context = await auth.$context;
	const session = await context.internalAdapter.createSession(userId);

	if (!session) {
		throw new Error('Failed to create auth session');
	}

	cookies.set(
		context.authCookies.sessionToken.name,
		await signCookieValue(session.token, context.secret),
		{
			...toSvelteKitCookieOptions(context.authCookies.sessionToken.attributes),
			maxAge: context.sessionConfig.expiresIn
		}
	);

	return session;
};
