import { z } from 'zod';

export const draftSubmissionPickSchema = z.object({
	draftPosition: z.number().int().min(1).max(64),
	team: z.string().trim().min(1).max(100),
	prospectId: z.string().trim().min(1).max(100).nullable()
});

export const draftSubmissionCommandSchema = z
	.object({
		draftBoardId: z.number().int().positive().optional(),
		picks: z.array(draftSubmissionPickSchema).min(1).max(64)
	})
	.superRefine(({ picks }, context) => {
		const positions = new Set<number>();
		const prospectIds = new Set<string>();

		for (const [index, pick] of picks.entries()) {
			if (positions.has(pick.draftPosition)) {
				context.addIssue({
					code: 'custom',
					message: 'Draft positions must be unique.',
					path: ['picks', index, 'draftPosition']
				});
			}
			positions.add(pick.draftPosition);

			if (!pick.prospectId) {
				continue;
			}

			if (prospectIds.has(pick.prospectId)) {
				context.addIssue({
					code: 'custom',
					message: 'Duplicate prospects are not allowed.',
					path: ['picks', index, 'prospectId']
				});
			}
			prospectIds.add(pick.prospectId);
		}
	});

export type DraftSubmissionCommand = z.output<typeof draftSubmissionCommandSchema>;
export type DraftSubmissionPick = z.output<typeof draftSubmissionPickSchema>;
