import { getContext, setContext } from "svelte"

type CurrentDraftState = "open" | "locked" | "started" | "finalized"
export interface DraftStateType {
  isDraftLocked: boolean;
  currentState: CurrentDraftState;
  nhlDraft: ProspectDrafted[];
  updateDraftStatus: (status: boolean) => void
  startNhlDraft: () => void
  currentNhlDraft: (pick: ProspectDrafted[]) => void
}

interface ProspectDrafted {
  position: number;
  name: string;
}

class DraftState {
  isDraftLocked = $state(false)
  currentState = $state("draft")
  nhlDraft: ProspectDrafted[] = $state([])

  constructor() {
    this.isDraftLocked = false
    this.currentState = "draft"
  }

  updateDraftStatus(status: boolean) {
      this.isDraftLocked = status
  }

  startNhlDraft() {
    this.isDraftLocked = true;
    this.currentState = "started"
  }

  currentNhlDraft(pick: ProspectDrafted[]) {
    this.nhlDraft = pick
  }

}

export function setDraftState() {
  const draftState = new DraftState()
  setContext('DRAFT_CTX', draftState)
  return draftState
}

export function getDraftState() {
  return getContext<DraftState>('DRAFT_CTX')
}