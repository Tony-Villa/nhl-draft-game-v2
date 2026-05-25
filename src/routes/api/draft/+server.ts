import { json } from '@sveltejs/kit';
import type { DraftBoard } from '$lib/types.js';
import { db } from '$lib/server/db/index.js';
import { CURRENT_GAME } from '$env/static/private';
import { and, eq, sql } from 'drizzle-orm';
import { draftBoardPicks, draftBoards } from '$lib/server/db/schema';
import {
	assertGameIsEditable,
	ensureGlobalGameEntry,
	getOrCreateDefaultDraftBoard
} from '$lib/server/services/draft-board-service.js';

export async function POST({ request, locals }) {
  const { data } = await request.json();

  const { draftboard, user } = data;
  const userId = locals.user?.id || user?.id;

  if (!userId) {
    return json({ message: 'failed', error: 'Authentication required' }, { status: 401 });
  }

  try {
    await assertGameIsEditable(CURRENT_GAME);

    const board = await getOrCreateDefaultDraftBoard(userId, CURRENT_GAME);
    const filledProspectIds = draftboard
      .map((draft: DraftBoard) => draft.prospect?.id)
      .filter(Boolean);
    const uniqueProspectIds = new Set(filledProspectIds);

    if (filledProspectIds.length !== uniqueProspectIds.size) {
      return json({ message: 'failed', error: 'Duplicate prospects are not allowed' }, { status: 400 });
    }

    await Promise.all(draftboard.map(async (draft: DraftBoard) => {
      if (!draft.teamName) return;

      if (draft.prospect && draft.prospect.id) {
        await db
          .insert(draftBoardPicks)
          .values({
            draftBoardId: board.id,
            positionDrafted: draft.draftPosition,
            team: draft.teamName,
            prospectId: draft.prospect.id,
            points: draft.points
          })
          .onConflictDoUpdate({
            target: [draftBoardPicks.draftBoardId, draftBoardPicks.positionDrafted],
            set: {
              team: draft.teamName,
              prospectId: draft.prospect.id,
              points: draft.points,
              updatedAt: sql`(cast (unixepoch() as int))`
            },
          });
      } else {
        await db
          .delete(draftBoardPicks)
          .where(
            and(
              eq(draftBoardPicks.draftBoardId, board.id),
              eq(draftBoardPicks.positionDrafted, draft.draftPosition)
            )
          );
      }
    }));

    await db
      .update(draftBoards)
      .set({
        status: 'submitted',
        submittedAt: sql`(cast (unixepoch() as int))`,
        updatedAt: sql`(cast (unixepoch() as int))`
      })
      .where(eq(draftBoards.id, board.id));

    await ensureGlobalGameEntry(userId, CURRENT_GAME, board.id);

  } catch (err) {
    console.error('Draft submission error:', err);
    return json({ 
      message: 'failed', 
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    });
  }

  return json({ message: 'success' });
}
