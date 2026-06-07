import { z } from 'zod';

export const boardSummariesQuerySchema = z.object({
	gameId: z.string().trim().min(1).max(100)
});

export type BoardSummariesQuery = z.output<typeof boardSummariesQuerySchema>;
