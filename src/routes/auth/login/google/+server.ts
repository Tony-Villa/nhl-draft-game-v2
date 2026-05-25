import type { RequestEvent } from '@sveltejs/kit';
import { redirectToSocialProvider } from '$lib/server/socialSignIn';

export async function GET(event: RequestEvent): Promise<Response> {
	return redirectToSocialProvider(event, 'google');
}
