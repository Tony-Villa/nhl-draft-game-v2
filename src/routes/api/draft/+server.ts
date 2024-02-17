import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { drafts } from '$lib/server/db/schema/drafts';
import type { DraftBoard } from '$lib/types.js';
import { eq, and } from 'drizzle-orm';

export async function POST({ request }) {
	const { data } = await request.json();
	// console.log('draftboard: ', data);
	// const hello = await request.json();

	data.forEach(async (draft: DraftBoard) => {
		if (!draft.prospect) return;

		const positionDraftedExists = await db
			.select()
			.from(drafts)
			.where(and(eq(drafts.positionDrafted, draft.draftPosition), eq(drafts.userId, '123')));

		if (positionDraftedExists.length > 0) {
			if (positionDraftedExists[0].prospect === JSON.stringify(draft.prospect)) {
				return;
			} else {
				await db
					.update(drafts)
					.set({
						prospect: JSON.stringify(draft.prospect)
					})
					.where(and(eq(drafts.positionDrafted, draft.draftPosition), eq(drafts.userId, '123')));
			}
		} else {
			await db.insert(drafts).values({
				userId: '123',
				positionDrafted: draft.draftPosition,
				prospect: JSON.stringify(draft.prospect)
			});
		}
	});

	return json({ message: 'success' });
}
