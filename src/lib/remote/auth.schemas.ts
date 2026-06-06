import { z } from 'zod';

export const authProviderRequestSchema = z.object({
	surface: z.enum(['login', 'register'])
});

export type AuthProviderSurface = z.infer<typeof authProviderRequestSchema>['surface'];
