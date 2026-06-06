import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';

export function requireRemoteUser() {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	return locals.user;
}
