import { json } from '@sveltejs/kit';
import { drafts } from '$lib/server/db/schema/drafts';
import type { DraftBoard } from '$lib/types.js';
import { db } from '$lib/server/db/index.js';
import { CURRENT_GAME } from '$env/static/private';
import { and, eq } from 'drizzle-orm';

export async function POST({ request, fetch }) {
  const { data } = await request.json();

  const { draftboard, user, undraftedProspectIds = [] } = data;

  try {
    // First, handle undrafted prospects - remove them from the database
    if (undraftedProspectIds.length > 0) {
      await Promise.all(undraftedProspectIds.map(async (prospectId: string) => {
        await db
          .delete(drafts)
          .where(
            and(
              eq(drafts.userId, user.id),
              eq(drafts.prospectId, prospectId),
              eq(drafts.gameId, CURRENT_GAME)
            )
          );
        console.log(`User action: User ${user.id} removed ${prospectId} from their draft board`);
      }));
    }

    // Then, get existing drafts for this user and game to check what was previously drafted
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
    
    // Create a map of existing prospect IDs to their positions
    const existingProspectPositions = new Map(
      existingDrafts
        .filter(d => d.prospectId)
        .map(d => [d.prospectId, d.positionDrafted])
    );

    await Promise.all(draftboard.map(async (draft: DraftBoard) => {
      if (!draft.teamName) return;

      // If there's a prospect, handle the draft
      if (draft.prospect && draft.prospect.id) {
        // Check if this prospect is already drafted at a different position
        const existingPosition = existingProspectPositions.get(draft.prospect.id);
        if (existingPosition && existingPosition !== draft.draftPosition) {
          // Remove the prospect from their previous position
          await db
            .delete(drafts)
            .where(
              and(
                eq(drafts.userId, user.id),
                eq(drafts.prospectId, draft.prospect.id),
                eq(drafts.gameId, CURRENT_GAME)
              )
            );
          console.log(`User action: User ${user.id} moved prospect ${draft.prospect.id} from position ${existingPosition} to ${draft.draftPosition}`);
        }
        
        // Insert or update the prospect at the new position
        await db
          .insert(drafts)
          .values({
            userId: user.id,
            positionDrafted: draft.draftPosition,
            team: draft.teamName,
            prospectId: draft.prospect.id,
            gameId: CURRENT_GAME
          })
          .onConflictDoUpdate({
            target: [drafts.positionDrafted, drafts.userId, drafts.gameId],
            set: { prospectId: draft.prospect.id },
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
    console.error('Draft submission error:', err);
    return json({ 
      message: 'failed', 
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    });
  }

  return json({ message: 'success' });
}