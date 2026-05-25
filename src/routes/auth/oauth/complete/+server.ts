import { redirect, type RequestEvent } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { ensureDefaultScore } from '$lib/server/authSideEffects';

export const GET = async (event: RequestEvent) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) {
		redirect(302, '/auth/login');
	}

	await ensureDefaultScore(session.user.id);

	redirect(302, '/draft-center');
};
