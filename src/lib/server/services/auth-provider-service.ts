import type { AuthProviderSurface } from '$lib/remote/auth.schemas';
import { authProviders } from '$lib/auth/providers';

export function getAuthProviderView(surface: AuthProviderSurface) {
	return {
		surface,
		providers: authProviders
	};
}
