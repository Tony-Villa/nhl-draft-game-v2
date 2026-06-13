import { query } from '$app/server';
import { authProviderRequestSchema } from './auth.schemas';
import { getAuthProviderView } from '$lib/server/services/auth-provider-service';

export const getAuthProviders = query(authProviderRequestSchema, ({ surface }) => {
	return getAuthProviderView(surface);
});
