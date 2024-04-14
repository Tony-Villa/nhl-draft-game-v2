import type { DraftBoard } from "$lib/types";

export function draftboardToMap(draftboard: DraftBoard[]) {
  const map: Record<string, DraftBoard[]> = {}

  draftboard.forEach((draft) => {
    if (!draft.prospect) {
      return;
    } else {
      map.draft = draftboard
    }
  });

  return map
}


