import { z } from 'zod';

export const draftInsightsQuerySchema = z.object({
	gameId: z.string().trim().min(1).max(100),
	position: z.coerce.number().int().min(1).max(32)
});

export type DraftInsightsQuery = z.output<typeof draftInsightsQuerySchema>;
