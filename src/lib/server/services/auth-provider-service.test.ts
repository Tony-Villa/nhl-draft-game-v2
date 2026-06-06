import { describe, expect, it } from 'vitest';
import { authProviderRequestSchema } from '$lib/remote/auth.schemas';
import { getAuthProviderView } from './auth-provider-service';

describe('auth provider remote query support', () => {
	it('accepts the supported component surfaces', () => {
		expect(authProviderRequestSchema.parse({ surface: 'login' })).toEqual({ surface: 'login' });
		expect(authProviderRequestSchema.parse({ surface: 'register' })).toEqual({
			surface: 'register'
		});
	});

	it('rejects unknown component surfaces', () => {
		expect(authProviderRequestSchema.safeParse({ surface: 'admin' }).success).toBe(false);
	});

	it('returns the existing OAuth destinations', () => {
		expect(getAuthProviderView('login')).toEqual({
			surface: 'login',
			providers: [
				{
					id: 'discord',
					label: 'discord',
					href: '/auth/login/discord'
				},
				{
					id: 'google',
					label: 'google',
					href: '/auth/login/google'
				}
			]
		});
	});
});
