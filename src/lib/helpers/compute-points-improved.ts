import type { Prospect } from '$lib/types';

interface DraftPick {
  userId?: string;
  prospect?: Prospect;
  positionDrafted: number;
  points?: number;
}

interface NHLDraftPick {
  prospectId: string;
  positionDrafted: number;
}

interface ComputePointsResult {
  userId: string;
  score: number;
}

/**
 * Improved scoring system using prospect IDs instead of string matching
 */
export function computePointsByProspectId(
  userDrafts: DraftPick[], 
  nhlDrafts: NHLDraftPick[]
): ComputePointsResult | undefined {
  const startingPoints = 10;
  const userId = userDrafts[0]?.userId;

  if (!userId) {
    return undefined;
  }

  // Create a map of prospect ID to NHL draft position for O(1) lookup
  const nhlDraftPositions = new Map<string, number>();
  nhlDrafts.forEach(pick => {
    nhlDraftPositions.set(pick.prospectId, pick.positionDrafted);
  });

  // Calculate points for each user draft pick
  userDrafts.forEach(draft => {
    if (!draft.prospect?.id) {
      draft.points = 0;
      return;
    }

    const nhlPosition = nhlDraftPositions.get(draft.prospect.id);
    
    if (nhlPosition !== undefined) {
      // Calculate points: 10 - |user_position - nhl_position|, minimum 0
      const pointDifference = Math.abs(draft.positionDrafted - nhlPosition);
      draft.points = Math.max(0, startingPoints - pointDifference);
    } else {
      // Prospect wasn't drafted in NHL first round
      draft.points = 0;
    }
  });

  return {
    userId,
    score: userDrafts.reduce((total, draft) => total + (draft.points || 0), 0)
  };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use computePointsByProspectId instead
 */
export function computePoints(user: DraftPick[], nhl: any[]): ComputePointsResult | undefined {
  // Convert legacy nhl format to new format
  const nhlDrafts: NHLDraftPick[] = nhl.map(pick => ({
    prospectId: pick.prospectId || '',
    positionDrafted: pick.positionDrafted
  }));

  return computePointsByProspectId(user, nhlDrafts);
}
