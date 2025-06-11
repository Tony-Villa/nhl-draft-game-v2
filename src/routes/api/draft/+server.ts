import { json } from '@sveltejs/kit';
import { drafts } from '$lib/server/db/schema/drafts';
import type { DraftBoard } from '$lib/types.js';
import { db } from '$lib/server/db/index.js';
import { CURRENT_GAME } from '$env/static/private';
import { and, eq } from 'drizzle-orm';

export async function POST({ request, fetch }) {
  const { data } = await request.json();

  const {draftboard, user} = data;

  try {
    // First, get existing drafts for this user and game to check what was previously drafted
    const existingDrafts = await db
      .select()
      .from(drafts)
      .where(
        and(
          eq(drafts.userId, user.id),
          eq(drafts.gameId, CURRENT_GAME)
        )
      );

    // Create a map of existing draft positions for easy lookup
    const existingDraftPositions = new Set(existingDrafts.map(d => d.positionDrafted));

    await Promise.all(draftboard.map(async (draft: DraftBoard) => {
      if (!draft.teamName) return;

      // If there's a prospect, insert or update
      if (draft.prospect) {
        await db
          .insert(drafts)
          .values({
            userId: user.id,
            positionDrafted: draft.draftPosition,
            team: draft.teamName,
            prospect: JSON.stringify(draft.prospect),
            gameId: CURRENT_GAME
          })
          .onConflictDoUpdate({
            target: [drafts.positionDrafted, drafts.userId, drafts.gameId],
            set: { prospect: JSON.stringify(draft.prospect) },
          });
      } 
      // If there's no prospect but this position was previously drafted, delete it
      else if (!draft.prospect && existingDraftPositions.has(draft.draftPosition)) {
        await db
          .delete(drafts)
          .where(
            and(
              eq(drafts.userId, user.id),
              eq(drafts.positionDrafted, draft.draftPosition),
              eq(drafts.gameId, CURRENT_GAME)
            )
          );
      }
    }));

  } catch (err) {
    console.error(err);
    return json({message: 'failed'});
  }

  return json({ message: 'success' });
}