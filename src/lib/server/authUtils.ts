import type { Cookies } from '@sveltejs/kit';
import { accounts, keys } from './db/schema';
import { auth } from './auth';

export const GITHUB_OAUTH_STATE_COOKIE_NAME = 'githubOauthState';
export const GOOGLE_OAUTH_STATE_COOKIE_NAME = 'googleOauthState';
export const GOOGLE_OAUTH_CODE_VERIFIER_COOKIE_NAME = 'googleOauthCodeVerifier';
export const DISCORD_OAUTH_STATE_COOKIE_NAME = 'discord_oauth_state';

type AuthAccountInput = {
	userId: string;
	providerId: string;
	providerUserId: string;
	password?: string | null;
};

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

const setExpiredCookie = (cookies: Cookies, name: string, attributes: BetterAuthCookieAttributes) => {
	cookies.set(name, '', {
		...toSvelteKitCookieOptions(attributes),
		maxAge: 0
	});
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

export const deleteSessionCookie = async (cookies: Cookies) => {
	const context = await auth.$context;

	setExpiredCookie(cookies, context.authCookies.sessionToken.name, context.authCookies.sessionToken.attributes);
	setExpiredCookie(cookies, context.authCookies.sessionData.name, context.authCookies.sessionData.attributes);
	setExpiredCookie(
		cookies,
		context.authCookies.dontRememberToken.name,
		context.authCookies.dontRememberToken.attributes
	);
};

export const invalidateSession = async (sessionToken: string, cookies: Cookies) => {
	const context = await auth.$context;

	await context.internalAdapter.deleteSession(sessionToken);
	await deleteSessionCookie(cookies);
};

export const linkAuthAccount = async (
	database: Pick<typeof import('./db').db, 'insert'>,
	{ userId, providerId, providerUserId, password = null }: AuthAccountInput
) => {
	await database
		.insert(accounts)
		.values({
			id: `${providerId}:${providerUserId}`,
			accountId: providerUserId,
			providerId,
			userId,
			password
		})
		.onConflictDoNothing();

	if (providerId !== 'credential') {
		await database
			.insert(keys)
			.values({
				providerId,
				providerUserId,
				userId
			})
			.onConflictDoNothing();
	}
};
