import { z } from 'zod';

export const leagueStandingsQuerySchema = z.object({
	slug: z
		.string()
		.trim()
		.min(1)
		.max(64)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
});

export const joinLeagueFormSchema = z.object({
	inviteCode: z
		.string()
		.trim()
		.toUpperCase()
		.min(1, 'Enter an invite code.')
		.max(32, 'Invite code is too long.')
		.regex(/^[A-Z0-9]+$/, 'Invite code may only contain letters and numbers.')
});

export const leaveLeagueFormSchema = z.object({
	slug: z
		.string()
		.trim()
		.min(1)
		.max(64)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
});

export const editLeagueFormSchema = z.object({
	slug: z
		.string()
		.trim()
		.min(1)
		.max(64)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	name: z
		.string()
		.trim()
		.min(3, 'League name must be at least 3 characters.')
		.max(80, 'League name must be 80 characters or fewer.'),
	description: z.string().trim().max(500, 'League description must be 500 characters or fewer.')
});

export type LeagueStandingsQuery = z.output<typeof leagueStandingsQuerySchema>;
export type JoinLeagueForm = z.output<typeof joinLeagueFormSchema>;
export type LeaveLeagueForm = z.output<typeof leaveLeagueFormSchema>;
export type EditLeagueForm = z.output<typeof editLeagueFormSchema>;
