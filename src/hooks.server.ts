import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { createAndSetSession } from '$lib/server/authUtils';
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { eq, or } from 'drizzle-orm';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle, HandleValidationError } from '@sveltejs/kit';

const SESSION_COOKIE_NAME = 'auth_session';

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (session) {
		event.locals.session = session.session;
		event.locals.user = {
			...session.user,
			avatarUrl: session.user.image ?? null
		};

		return svelteKitHandler({ event, resolve, auth, building });
	}

	const legacySessionId = event.cookies.get(SESSION_COOKIE_NAME);

	if (legacySessionId) {
		const [legacySession] = await db
			.select({
				session: sessions,
				user: users
			})
			.from(sessions)
			.innerJoin(users, eq(sessions.userId, users.id))
			.where(or(eq(sessions.id, legacySessionId), eq(sessions.token, legacySessionId)))
			.limit(1);

		const expiresAt =
			legacySession?.session.expiresAt instanceof Date
				? legacySession.session.expiresAt.getTime()
				: Number(legacySession?.session.expiresAt);

		if (legacySession && expiresAt > Date.now()) {
			const newSession = await createAndSetSession(legacySession.user.id, event.cookies);

			event.locals.session = newSession;
			event.locals.user = {
				id: legacySession.user.id,
				email: legacySession.user.email,
				emailVerified: legacySession.user.emailVerified,
				name: legacySession.user.name ?? '',
				image: legacySession.user.avatarUrl,
				avatarUrl: legacySession.user.avatarUrl,
				createdAt: new Date(legacySession.user.createdAt),
				updatedAt: legacySession.user.updatedAt,
				keys: legacySession.user.keys
			};

			return svelteKitHandler({ event, resolve, auth, building });
		}
	}

	event.locals.session = null;
	event.locals.user = null;

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handleValidationError: HandleValidationError = () => {
	return {
		message: 'Invalid remote function input'
	};
};
